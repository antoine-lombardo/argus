# Changesets

This folder drives the **host app's user-facing version** (`package.json` →
`app.config.js` → `expo.version`). It mirrors the flow used by
`argus-plugin-sdk`, but this package is **private**: Changesets versions and
tags it, and **never publishes to npm**. The build number is owned by EAS
(`autoIncrement`), not Changesets.

## Workflow

1. Make your change.
2. Add a changeset describing it and the semver bump:

   ```bash
   npm run changeset
   ```

   While the app is `0.x`: breaking/large changes are `minor`, everything else
   is `patch`. Commit the generated file under `.changeset/`.
3. Push / open a PR to `main`. The **Release** workflow opens or updates a
   **"chore: version packages"** PR that applies the bump + updates
   `CHANGELOG.md`.
4. **Merging that PR** bumps `package.json`, then creates and pushes a git tag
   (`argus@<version>`) — the trigger for the EAS build workflows.

See [docs/PACKAGING.md](../docs/PACKAGING.md#host-app-versioning) and
[ADR 0003](../docs/adr/0003-app-versioning.md).
