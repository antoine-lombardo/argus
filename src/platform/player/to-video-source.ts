import type { DrmScheme, StreamDescriptor, StreamType } from '@argus-tv/plugin-sdk';
import type { DRMOptions, VideoSource } from 'expo-video';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import {
  AXINOM_FPS_CERT_BASE64,
  AXINOM_FPS_CERT_URL,
} from '@/platform/player/axinom-fps-cert';

function contentTypeFor(
  type: StreamType,
): 'auto' | 'hls' | 'dash' | 'progressive' {
  switch (type) {
    case 'hls':
      return 'hls';
    case 'dash':
      return 'dash';
    case 'mp4':
      return 'progressive';
    default:
      return 'auto';
  }
}

/**
 * Native DRM is platform-specific:
 * - Widevine → Android only (not Apple)
 * - FairPlay → Apple device only (not Simulator; not Android)
 */
export function drmSupportedOnPlatform(scheme: DrmScheme): boolean {
  if (scheme === 'widevine') {
    return Platform.OS === 'android';
  }
  if (scheme === 'fairplay') {
    // tvOS/iOS Simulator throws if AVContentKeySession FairPlay is created.
    return Platform.OS === 'ios' && Device.isDevice;
  }
  return false;
}

export function drmBlockReason(scheme: DrmScheme): string {
  if (scheme === 'widevine') {
    return 'Widevine only runs on Android TV (not Apple TV).';
  }
  if (scheme === 'fairplay') {
    if (Platform.OS !== 'ios') {
      return 'FairPlay only runs on Apple TV (not Android).';
    }
    if (!Device.isDevice) {
      return 'FairPlay is not supported on the Simulator — use a physical Apple TV.';
    }
  }
  return `${scheme} is not supported here.`;
}

/**
 * Map plugin `StreamDescriptor` → expo-video `VideoSource` (ADR 0006).
 * SDK `licenseUrl` / `scheme` → Expo `licenseServer` / `type`.
 * Caller must not invoke this when `drmSupportedOnPlatform` is false.
 */
export function toVideoSource(stream: StreamDescriptor): VideoSource {
  const source: VideoSource = {
    uri: stream.url,
    contentType: contentTypeFor(stream.type),
  };

  if (stream.headers) {
    source.headers = stream.headers;
  }

  if (stream.drm) {
    const drm: DRMOptions = {
      type: stream.drm.scheme,
      licenseServer: stream.drm.licenseUrl,
      headers: stream.drm.headers,
    };

    // Spike: embed Axinom eval cert so play does not depend on fetching the .cer.
    // expo-video ignores certificateUrl when base64CertificateData is set.
    if (stream.drm.certificateUrl === AXINOM_FPS_CERT_URL) {
      drm.base64CertificateData = AXINOM_FPS_CERT_BASE64;
    } else if (stream.drm.certificateUrl) {
      drm.certificateUrl = stream.drm.certificateUrl;
    }

    source.drm = drm;
  }

  return source;
}
