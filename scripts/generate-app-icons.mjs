import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SOURCE = 'public/images/ColorAuto.png';
const ICON_DIR = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';

// iOS required icon sizes
const ICONS = [
  { size: 20, scales: [2, 3] },
  { size: 29, scales: [2, 3] },
  { size: 38, scales: [2, 3] },
  { size: 40, scales: [2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 64, scales: [2, 3] },
  { size: 68, scales: [2] },
  { size: 76, scales: [2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] },
];

async function generateIcons() {
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
  }

  const images = [];

  for (const { size, scales } of ICONS) {
    for (const scale of scales) {
      const px = Math.round(size * scale);
      const filename = `AppIcon-${size}x${size}@${scale}x.png`;
      const outPath = path.join(ICON_DIR, filename);

      // Create a square icon with the logo centered on a dark background
      const bg = sharp({
        create: {
          width: px,
          height: px,
          channels: 4,
          background: { r: 15, g: 23, b: 42, alpha: 1 }, // slate-900
        },
      }).png();

      // Resize the logo to fit with padding
      const logoPadding = Math.round(px * 0.15);
      const logoWidth = px - logoPadding * 2;
      const logoHeight = Math.round(logoWidth * 0.375); // match aspect ratio ~1658/622

      const logoBuffer = await sharp(SOURCE)
        .resize(logoWidth, logoHeight, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      const bgBuffer = await bg.toBuffer();

      await sharp(bgBuffer)
        .composite([{
          input: logoBuffer,
          gravity: 'centre',
        }])
        .png()
        .toFile(outPath);

      images.push({
        filename,
        idiom: 'universal',
        platform: 'ios',
        scale: `${scale}x`,
        size: `${size}x${size}`,
      });

      console.log(`✓ ${filename} (${px}x${px})`);
    }
  }

  // Write Contents.json
  const contents = {
    images,
    info: {
      author: 'xcode',
      version: 1,
    },
  };

  fs.writeFileSync(
    path.join(ICON_DIR, 'Contents.json'),
    JSON.stringify(contents, null, 2),
  );

  console.log('\n✓ Contents.json written');
  console.log('Done! App icons generated.');
}

generateIcons().catch(console.error);
