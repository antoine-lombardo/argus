#!/usr/bin/env node
/**
 * EAS Build runs in a sandbox without sibling checkouts.
 * Clone + build `@argus-tv/plugin-sdk` next to this repo so `file:../argus-plugin-sdk` resolves.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sdk = join(root, '..', 'argus-plugin-sdk');

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', encoding: 'utf8' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (!existsSync(join(sdk, 'package.json'))) {
  console.log('[eas-pre-install] cloning argus-plugin-sdk…');
  run('git', [
    'clone',
    '--depth',
    '1',
    'https://github.com/antoine-lombardo/argus-plugin-sdk.git',
    sdk,
  ], root);
}

console.log('[eas-pre-install] building argus-plugin-sdk…');
if (existsSync(join(sdk, 'package-lock.json'))) {
  run('npm', ['ci'], sdk);
} else {
  run('npm', ['install'], sdk);
}
run('npm', ['run', 'build'], sdk);
