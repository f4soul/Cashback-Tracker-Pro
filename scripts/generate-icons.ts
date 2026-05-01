import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const inputSvg = path.join(process.cwd(), 'public', 'icon.svg');
  const outputDir = path.join(process.cwd(), 'public');

  if (!fs.existsSync(inputSvg)) {
    console.error('Input SVG not found at:', inputSvg);
    return;
  }

  console.log('Generating PWA icons from SVG...');

  try {
    // Generate 192x192
    await sharp(inputSvg)
      .resize(192, 192)
      .png()
      .toFile(path.join(outputDir, 'pwa-192x192.png'));
    console.log('Created pwa-192x192.png');

    // Generate 512x512
    await sharp(inputSvg)
      .resize(512, 512)
      .png()
      .toFile(path.join(outputDir, 'pwa-512x512.png'));
    console.log('Created pwa-512x512.png');

    // Updated apple-touch-icon.png (180x180)
    await sharp(inputSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('Updated apple-touch-icon.png (180x180)');

    // Generate favicon.ico (or just favicon.png 32x32)
    await sharp(inputSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon.png'));
    console.log('Created favicon.png (32x32)');

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
