import { describe, expect, it } from 'vitest';

import { isPluginReleaseNewer } from '@/platform/repos/types';

import { formatRelease } from './check-updates';

describe('formatRelease', () => {
  it('formats version+build', () => {
    expect(formatRelease({ version: '0.1.0', build: 3 })).toBe('0.1.0+3');
  });
});

describe('isPluginReleaseNewer (update check)', () => {
  it('detects newer build on same version', () => {
    expect(
      isPluginReleaseNewer(
        { version: '0.1.0', build: 2 },
        { version: '0.1.0', build: 1 },
      ),
    ).toBe(true);
  });
});
