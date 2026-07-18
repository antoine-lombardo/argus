#!/usr/bin/env node
/**
 * Copy the built example plugin into host assets as a first-launch seed.
 * Same files the official GitHub Pages repo will host.
 *
 * Usage (from argus/): npm run plugins:sync-seed
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const example = path.resolve(root, '../argus-plugins/packages/example');
const distJs = path.join(example, 'dist/index.js');
const manifest = path.join(example, 'manifest.json');
const outDir = path.join(root, 'assets/plugins/argus.example');

if (!fs.existsSync(distJs)) {
  console.error(
    'Missing',
    distJs,
    '\nRun: cd ../argus-plugins/packages/example && npm run build',
  );
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(distJs, path.join(outDir, 'index.js.txt'));
// Prefer stamped dist manifest (includes build); fall back to source manifest.
const stamped = path.join(example, 'dist/manifest.json');
fs.copyFileSync(
  fs.existsSync(stamped) ? stamped : manifest,
  path.join(outDir, 'manifest.json.txt'),
);
console.log('Synced seed plugin →', outDir);
