# Packaging, builds & distribution

How Argus is built and delivered to devices. Scope for now: **private developers only** — no public store release. We still need repeatable builds, a way to install on real Apple TV + Android TV hardware, and automated builds in GitHub Actions.

Complements [ARCHITECTURE.md](ARCHITECTURE.md) (what the app is) and [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) (build order). Items marked **(default)** are provisional and can change via an ADR.

> Note: this is about shipping the **host app**. Plugin packaging/distribution (`.argus-plugin`, repo index) is separate — see [ARCHITECTURE.md](ARCHITECTURE.md#repository-system).

## Goals

- Reproducible builds for **tvOS** and **Android TV** from one codebase
- Easy install on developer devices for testing (no public store)
- Automated builds on **GitHub Actions**, non-interactive, secrets-driven
- A path that scales later to TestFlight/Play internal tracks without rework

## Constraints & context

- Stack: **Expo + dev client**, `react-native-tvos` (TV support), TypeScript.
- Targets: **Apple TV (tvOS)** and **Android TV**.
- tvOS builds require **macOS + Xcode + an Apple Developer Program membership** ($99/yr) and code-signing assets. Android has no such gate.
- Apple TV **cannot** install arbitrary APK-style files: apps arrive via **Xcode/Apple Configurator (dev-signed)** or **TestFlight**. Android TV installs a plain **APK** (`adb install`, file manager, or a distribution service).

---

## Build approach

Two viable engines. **Default: EAS Build** (Expo's hosted build service) to avoid managing Xcode signing and macOS runners ourselves; keep local/prebuild as the escape hatch.

```mermaid
flowchart TB
  Src[Source: Expo RN TV app]
  subgraph engines [Build engines]
    EAS[EAS Build - hosted<br/>iOS/tvOS + Android]
    Local[Local prebuild + Xcode/Gradle]
  end
  Src --> EAS
  Src --> Local
  EAS --> IPA[tvOS .ipa]
  EAS --> APK[Android TV .apk/.aab]
  Local --> IPA
  Local --> APK
```

### Option A — EAS Build (default)

- One CLI (`eas build`) produces tvOS and Android TV artifacts; handles credentials/signing.
- Runs fine from GitHub Actions with an `EXPO_TOKEN` (no macOS runner needed — builds happen on Expo infra).
- Cost/quota: free tier is limited; TV + frequent CI may need a paid plan — **decision to confirm**.
- Requires `eas.json` build profiles.

### Option B — Local / self-hosted builds

- `expo prebuild` then native builds: **Gradle** for Android (works on Linux runners), **Xcode** for tvOS (needs a macOS runner + manual signing setup).
- No Expo quota; more maintenance (certs, provisioning, Xcode versions on runners).
- Good fallback for Android APKs even if we use EAS for tvOS.

### Build profiles (`eas.json`, sketch)

```jsonc
{
  "build": {
    "development": {            // dev client, for day-to-day device testing
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "preview": {                // release-like, internal testers
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {             // future: store/TestFlight/Play tracks
      "distribution": "store"
    }
  }
}
```

---

## Distribution to developer devices (private)

```mermaid
flowchart LR
  subgraph android [Android TV]
    A1[Signed APK]
    A1 --> adb[adb install]
    A1 --> link[Download link / QR]
    A1 --> fad[Firebase App Distribution]
  end
  subgraph apple [Apple TV / tvOS]
    B1[dev-signed build]
    B1 --> xc[Xcode / Apple Configurator]
    B1 --> tf[TestFlight internal]
  end
```

### Android TV (easy)

- **Primary (default):** build a signed **APK**, install via `adb install app.apk` over the network (Android TV → enable developer mode + ADB debugging).
- **Convenience:** distribute the APK link/QR (EAS internal distribution) or **Firebase App Distribution** for tester management and update notifications.
- Keep a single **upload keystore** as a CI secret so every build is install-over-install compatible.

### Apple TV / tvOS (gated)

- **Requires** Apple Developer Program membership + registered **device UDIDs** for ad-hoc, or an internal **TestFlight** group.
- **Default:** use **TestFlight internal testing** — simplest way to get builds onto real Apple TVs without wiring each device, and it scales to more testers later.
- **Alternative:** ad-hoc dev-signed build installed via **Xcode** or **Apple Configurator** (needs each Apple TV's UDID registered; install is cabled/paired).
- Simulator builds (tvOS Simulator) are fine for fast iteration and need no signing.

### Reality check for "private developers only"

- Android: fully self-serve, no accounts, no cost.
- tvOS: you need the paid Apple account and App Store Connect app record even for private TestFlight. There is no true "sideload an IPA on Apple TV" path comparable to Android. Plan around TestFlight from the start.

---

## GitHub Actions

```mermaid
flowchart TB
  PR[Pull request] --> CI[CI: typecheck + lint + unit tests]
  Tag[Tag / manual dispatch] --> Build[Build job]
  Build -->|EAS or Gradle/Xcode| Artifacts
  Artifacts --> Store1[Upload APK artifact / Firebase]
  Artifacts --> Store2[tvOS to TestFlight via eas submit]
```

### Workflows (planned)

1. **`ci.yml`** — on PR: install, typecheck, lint, unit tests (Linux runner, cheap, no native build).
2. **`build-android.yml`** — on tag/dispatch: build signed Android TV APK.
   - Path A (default): `eas build -p android --profile preview --non-interactive` with `EXPO_TOKEN`.
   - Path B: Gradle build on `ubuntu-latest`, sign with keystore secret, upload APK artifact / push to Firebase App Distribution.
3. **`build-tvos.yml`** — on tag/dispatch: build + optionally submit tvOS.
   - Path A (default): `eas build -p ios --profile preview` then `eas submit -p ios` to TestFlight (uses Expo infra; no macOS runner needed).
   - Path B: `macos-latest` runner + Xcode + `fastlane`/manual signing (more setup).

### Secrets needed

| Secret | Used for |
|--------|----------|
| `EXPO_TOKEN` | Non-interactive EAS build/submit |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | Signing Android TV APK (Path B / local signing) |
| `APPLE_APP_STORE_CONNECT_API_KEY` (+ issuer/key id) | `eas submit` / fastlane to TestFlight |
| `FIREBASE_APP_ID`, `FIREBASE_TOKEN` (optional) | Firebase App Distribution for Android testers |

Store all in GitHub Actions secrets; never commit them (matches the no-secrets-in-git rule).

### Versioning builds

- **App version** from `app.json`/`app.config.ts`; auto-increment **build number** in CI (EAS `autoIncrement` or a CI step).
- Tag releases (e.g. `v0.1.0`) to trigger build workflows; attach artifacts to the GitHub Release for Android.

---

## Recommended path (v0)

For a solo/private setup optimizing for speed:

1. **Android TV first** — local/EAS APK, `adb install` to a real device. Zero account friction; validates the app + DRM spike quickly.
2. **Add EAS + `EXPO_TOKEN`** and a `build-android.yml` producing a downloadable APK artifact on tag.
3. **Apple TV** — enroll in Apple Developer Program, set up TestFlight internal, use `eas build` + `eas submit` from Actions.
4. **Optional:** Firebase App Distribution once there is more than one Android tester.

---

## Decisions to confirm

- [ ] **EAS vs self-hosted** builds (default: EAS; revisit on cost/quota).
- [ ] **Apple Developer Program** enrollment + who owns the account/team.
- [ ] **tvOS distribution:** TestFlight (default) vs ad-hoc + Apple Configurator.
- [ ] **Android tester distribution:** raw APK/`adb` (default) vs Firebase App Distribution.
- [ ] **APK vs AAB** for Android internal (APK is simpler for sideload; AAB needed only for Play).

Turn confirmed choices into an ADR (`docs/adr/`) and update the build tasks in [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md).

## Out of scope (for now)

- Public App Store / Play Store release and review
- Auto-update of the host app (Android in-app updates, App Store phased release)
- OTA JS updates for the host (Expo Updates) — revisit alongside plugin hot-update policy
