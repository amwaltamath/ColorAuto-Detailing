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

const sizes = [
  // icon: shown on lock screen and notification center
  { name: 'icon.png', size: 29 },
  { name: 'icon@2x.png', size: 58 },
  { name: 'icon@3x.png', size: 87 },
  // logo: shown in the top-left of the pass
  { name: 'logo.png', size: 50 },
  { name: 'logo@2x.png', size: 100 },
  { name: 'logo@3x.png', size: 150 },
  // thumbnail: shown on the right side of generic pass
  { name: 'thumbnail.png', size: 90 },
  { name: 'thumbnail@2x.png', size: 180 },
  { name: 'thumbnail@3x.png', size: 270 },
];

for (const { name, size } of sizes) {
  await sharp(source)
    .resize(size, size, { fit: 'contain', background: { r: 37, g: 99, b: 235, alpha: 1 } })
    .png()
    .toFile(join(dest, name));

  console.log(`  ✓ ${name} (${size}×${size})`);
}

console.log('\nDone! Pass icons generated in wallet-pass-model.pass/');
