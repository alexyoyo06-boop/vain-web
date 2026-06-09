// Convierte logo2.jpg (VAIN negro sobre blanco) en logo2.png con fondo transparente.
// Detecta píxeles cercanos a blanco y los convierte en alpha=0.
const path = require("node:path");
const sharp = require("sharp");

const src = path.join(__dirname, "..", "public", "logo2.jpg");
const dst = path.join(__dirname, "..", "public", "logo2.png");

const WHITE_THRESHOLD = 240; // r,g,b >= 240 → transparente

(async () => {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const px = info.width * info.height;
  for (let i = 0; i < px; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      data[o + 3] = 0;
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
    .png({ compressionLevel: 9 })
    .toFile(dst);

  console.log(`Wrote ${dst}`);
})();
