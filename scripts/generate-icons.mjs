#!/usr/bin/env node
/**
 * Regenerate app / TV / splash icons from assets/brand/icon-mark.svg.
 *
 * Requires: npm i -D @resvg/resvg-js sharp  (dev-only; run when regenerating)
 * Usage:    node scripts/generate-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVG = fs.readFileSync(path.join(ROOT, 'assets/brand/icon-mark.svg'));
/** Warm stone field + subtle vertical gradient (light top → deeper bottom). */
const BG_TOP = '#F3EEE6';
const BG_BOTTOM = '#D4C9B8';
const MARK = { r: 28, g: 30, b: 36 }; // #1C1E24
/** Target fill of the limiting canvas edge after trim (wide mark → width-limited on squares). */
const MARK_FILL = 0.82;
/** Android adaptive safe-ish zone (slightly under MARK_FILL). */
const MARK_FILL_ADAPTIVE = 0.76;

function renderMarkPng(size) {
  const resvg = new Resvg(SVG, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',
  });
  return Buffer.from(resvg.render().asPng());
}

function gradientBgPng(width, height) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BG_TOP}"/>
      <stop offset="55%" stop-color="#E8E2D8"/>
      <stop offset="100%" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#stone)"/>
</svg>`;
  const resvg = new Resvg(Buffer.from(svg), {
    fitTo: { mode: 'width', value: width },
  });
  return Buffer.from(resvg.render().asPng());
}

async function recolorMark(markPng, color) {
  const { data, info } = await sharp(markPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = color.r;
      data[i + 1] = color.g;
      data[i + 2] = color.b;
    }
  }
  return sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Trim SVG padding, then scale mark to `fill` of the limiting canvas edge. */
async function sizedMark(markPng, width, height, fill = MARK_FILL) {
  const trimmed = await sharp(markPng).trim().png().toBuffer();
  const { width: mw, height: mh } = await sharp(trimmed).metadata();
  const aspect = mw / mh;
  let targetW;
  let targetH;
  if (width / height > aspect) {
    // Canvas wider than mark — grow by height (topshelf / banners).
    targetH = Math.round(height * fill);
    targetW = Math.round(targetH * aspect);
  } else {
    // Square / taller — grow by width.
    targetW = Math.round(width * fill);
    targetH = Math.round(targetW / aspect);
  }
  const maxW = Math.round(width * 0.94);
  const maxH = Math.round(height * 0.94);
  if (targetW > maxW) {
    targetW = maxW;
    targetH = Math.round(targetW / aspect);
  }
  if (targetH > maxH) {
    targetH = maxH;
    targetW = Math.round(targetH * aspect);
  }
  return sharp(trimmed).resize(targetW, targetH).png().toBuffer();
}

async function opaqueRgb(width, height, markPng, fill = MARK_FILL) {
  const bg = await sharp(gradientBgPng(width, height))
    .resize(width, height)
    .removeAlpha()
    .png()
    .toBuffer();
  const m = await sizedMark(markPng, width, height, fill);
  return sharp(bg)
    .composite([{ input: m, gravity: 'centre' }])
    .removeAlpha()
    .png()
    .toBuffer();
}

async function main() {
  const IMAGES = path.join(ROOT, 'assets/images');
  const TV = path.join(ROOT, 'assets/tv_icons');
  const BRAND = path.join(ROOT, 'assets/brand');

  const mark1024 = renderMarkPng(1024);
  const mark = await recolorMark(mark1024, MARK);
  const markMono = await recolorMark(mark1024, { r: 255, g: 255, b: 255 });
  await sharp(await sizedMark(mark, 1024, 1024))
    .toFile(path.join(BRAND, 'icon-mark-transparent.png'));

  const master = await opaqueRgb(1024, 1024, mark);
  await sharp(master).toFile(path.join(BRAND, 'icon-master.png'));
  await sharp(master).toFile(path.join(IMAGES, 'icon.png'));
  await sharp(master).resize(512, 512).removeAlpha().toFile(path.join(IMAGES, 'splash-icon.png'));
  await sharp(master).resize(48, 48).removeAlpha().toFile(path.join(IMAGES, 'favicon.png'));

  await sharp(gradientBgPng(512, 512))
    .removeAlpha()
    .png()
    .toFile(path.join(IMAGES, 'android-icon-background.png'));

  const fgMark = await sizedMark(mark, 512, 512, MARK_FILL_ADAPTIVE);
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: fgMark, gravity: 'centre' }])
    .png()
    .toFile(path.join(IMAGES, 'android-icon-foreground.png'));

  const monoMark = await sizedMark(markMono, 432, 432, MARK_FILL_ADAPTIVE);
  await sharp({
    create: {
      width: 432,
      height: 432,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: monoMark, gravity: 'centre' }])
    .png()
    .toFile(path.join(IMAGES, 'android-icon-monochrome.png'));

  const tvSizes = {
    'icon-400x240.png': [400, 240],
    'icon-800x480.png': [800, 480],
    'icon-1280x768.png': [1280, 768],
    'icon-760x760.png': [760, 760],
    'icon-1920x720.png': [1920, 720],
    'icon-3840x1440.png': [3840, 1440],
    'icon-2320x720.png': [2320, 720],
    'icon-4640x1440.png': [4640, 1440],
  };

  for (const [name, [w, h]] of Object.entries(tvSizes)) {
    await sharp(await opaqueRgb(w, h, mark)).toFile(path.join(TV, name));
  }

  console.log('Regenerated icons from assets/brand/icon-mark.svg');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
