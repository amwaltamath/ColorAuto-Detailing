/**
 * Generate Apple Wallet pass icon images from the company logo.
 *
 * Run: node scripts/generate-pass-icons.mjs
 *
 * Creates icon.png, icon@2x.png, icon@3x.png, logo.png, logo@2x.png,
 * and thumbnail.png / thumbnail@2x.png in wallet-pass-model.pass/
 */

import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'public', 'images', 'ColorAuto.png');
const dest = join(root, 'wallet-pass-model.pass');

const bg = { r: 37, g: 99, b: 235, alpha: 1 };

const images = [
  // icon: small square on lock screen — crop to center so the logo mark fills the space
  { name: 'icon.png', w: 29, h: 29, fit: 'cover' },
  { name: 'icon@2x.png', w: 58, h: 58, fit: 'cover' },
  { name: 'icon@3x.png', w: 87, h: 87, fit: 'cover' },
  // logo: wide slot at top of pass — keep full logo, Apple recommends max 160×50 @1x
  { name: 'logo.png', w: 160, h: 50, fit: 'contain' },
  { name: 'logo@2x.png', w: 320, h: 100, fit: 'contain' },
  { name: 'logo@3x.png', w: 480, h: 150, fit: 'contain' },
  // thumbnail: shown on right side — crop so logo mark fills the square
  { name: 'thumbnail.png', w: 90, h: 90, fit: 'cover' },
  { name: 'thumbnail@2x.png', w: 180, h: 180, fit: 'cover' },
  { name: 'thumbnail@3x.png', w: 270, h: 270, fit: 'cover' },
];

for (const { name, w, h, fit } of images) {
  await sharp(source)
    .resize(w, h, { fit, background: bg, position: 'centre' })
    .png()
    .toFile(join(dest, name));

  console.log(`  ✓ ${name} (${w}×${h}, ${fit})`);
}

console.log('\nDone! Pass icons generated in wallet-pass-model.pass/');
