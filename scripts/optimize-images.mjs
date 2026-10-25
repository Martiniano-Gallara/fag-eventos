import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const galleryDir = path.resolve('assets/gallery');
const originalsDir = path.resolve('assets/_originals');

if (!fs.existsSync(originalsDir)) {
  fs.mkdirSync(originalsDir, { recursive: true });
}

const imagesToProcess = [
  { file: 'mural-lead-singer.jpg', width: 1200 },
  { file: 'mural-latin-artist.jpg', width: 1200 },
  { file: 'mural-guitar-solo.jpg', width: 1200 },
  { file: 'mural-female-star.jpg', width: 1200 },
  { file: 'brocheriano-escenario.png' },
  { file: 'brocheriano-predio.png' },
  { file: 'carnaval-2026-montaje.png' },
  { file: 'san-patricio.jpg', height: 800 },
  { file: 'carnaval-santa-rosa.jpg' },
  { file: 'delicias-pascua-2026.jpg' },
  { file: 'dulce-ciudad.jpg' },
  { file: 'sabores-serranos.jpg' }
];

async function run() {
  console.log('Starting image optimization...');
  for (const item of imagesToProcess) {
    const srcPath = path.join(galleryDir, item.file);
    if (!fs.existsSync(srcPath)) {
      console.warn(`File not found: ${srcPath}`);
      continue;
    }

    const ext = path.extname(item.file);
    const baseName = path.basename(item.file, ext);
    const webpFileName = `${baseName}.webp`;
    const destWebpPath = path.join(galleryDir, webpFileName);

    let pipeline = sharp(srcPath);

    if (item.width) {
      pipeline = pipeline.resize({ width: item.width, withoutEnlargement: true });
    } else if (item.height) {
      pipeline = pipeline.resize({ height: item.height, withoutEnlargement: true });
    }

    await pipeline.webp({ quality: 80 }).toFile(destWebpPath);

    const origStats = fs.statSync(srcPath);
    const webpStats = fs.statSync(destWebpPath);
    console.log(
      `Converted ${item.file} (${Math.round(origStats.size / 1024)} KB) -> ${webpFileName} (${Math.round(webpStats.size / 1024)} KB)`
    );

    // Move original to assets/_originals
    const targetOriginalPath = path.join(originalsDir, item.file);
    fs.copyFileSync(srcPath, targetOriginalPath);
    fs.unlinkSync(srcPath);
  }

  console.log('Image optimization finished successfully.');
}

run().catch((err) => {
  console.error('Error during image optimization:', err);
  process.exit(1);
});
