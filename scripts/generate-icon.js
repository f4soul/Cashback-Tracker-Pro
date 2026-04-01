import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  try {
    const svgBuffer = fs.readFileSync('public/icon.svg');
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile('public/apple-touch-icon.png');
    console.log('Successfully created apple-touch-icon.png');
  } catch (err) {
    console.error('Error generating icon:', err);
  }
}

convert();
