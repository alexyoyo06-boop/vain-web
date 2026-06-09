// Genera app/icon.png (32px) + app/apple-icon.png (180px) desde "logo 2.jpg"
// de la raíz del repo. Quita el blanco del JPG, recorta el bounding box del
// logo, lo centra en un cuadrado con fondo bone (#f3efe6) con padding.

const path = require("node:path");
const sharp = require("sharp");

const src = path.join(__dirname, "..", "..", "logo 2.jpg");
const iconOut = path.join(__dirname, "..", "app", "icon.png");
const appleOut = path.join(__dirname, "..", "app", "apple-icon.png");

const BONE = { r: 243, g: 239, b: 230, alpha: 1 };
const WHITE_THRESHOLD = 240;

async function logoToTransparentPng() {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4;
    if (
      data[o] >= WHITE_THRESHOLD &&
      data[o + 1] >= WHITE_THRESHOLD &&
      data[o + 2] >= WHITE_THRESHOLD
    ) {
      data[o + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png()
    .toBuffer();
}

async function buildSquareIcon(size, logoPct, outPath) {
  const logoTransparent = await logoToTransparentPng();
  const inner = Math.round(size * logoPct);
  const logo = await sharp(logoTransparent)
    .resize({ width: inner, height: inner, fit: "inside" })
    .toBuffer();
  const meta = await sharp(logo).metadata();
  const left = Math.round((size - (meta.width ?? inner)) / 2);
  const top = Math.round((size - (meta.height ?? inner)) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BONE,
    },
  })
    .composite([{ input: logo, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`Wrote ${outPath} (${size}x${size})`);
}

(async () => {
  // Favicon de pestaña: 32x32, logo al 78% para que respire mínimo
  await buildSquareIcon(32, 0.78, iconOut);
  // iOS apple-icon: 180x180, mismo ratio
  await buildSquareIcon(180, 0.78, appleOut);
})();
