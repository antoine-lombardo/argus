import { describe, expect, it } from 'vitest';

import {
  isPluginReleaseNewer,
  shouldShowChannelPicker,
} from '@/platform/repos/types';

describe('isPluginReleaseNewer', () => {
  it('prefers higher semver', () => {
    expect(
      isPluginReleaseNewer(
        { version: '0.2.0', build: 1 },
        { version: '0.1.0', build: 99 },
      ),
    ).toBe(true);
  });

  it('prefers higher build when version matches', () => {
    expect(
      isPluginReleaseNewer(
        { version: '0.1.0', build: 3 },
        { version: '0.1.0', build: 2 },
      ),
    ).toBe(true);
  });

  it('returns false when candidate is older', () => {
    expect(
      isPluginReleaseNewer(
        { version: '0.1.0', build: 1 },
        { version: '0.1.0', build: 2 },
      ),
    ).toBe(false);
  });
});

describe('shouldShowChannelPicker', () => {
  it('hides when channels missing or empty', () => {
    expect(shouldShowChannelPicker(undefined)).toBe(false);
    expect(shouldShowChannelPicker([])).toBe(false);
  });

  it('shows when at least one extra channel exists', () => {
    expect(
      shouldShowChannelPicker([
        { id: 'experimental', name: 'Experimental', index: 'channels/experimental.json' },
      ]),
    ).toBe(true);
  });
});
