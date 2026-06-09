// Procesa LOGO_EN3D.png de la raíz: quita el fondo blanco para que se pueda
// usar como mask-image en MetallicLogo (efecto cromo). Trim al bounding box
// para que el contenedor no tenga padding fantasma.

const path = require("node:path");
const sharp = require("sharp");

const src = path.join(__dirname, "..", "..", "LOGO_EN3D.png");
const dst = path.join(__dirname, "..", "public", "logo_en3d.png");

// Limpieza del halo antialias: cualquier píxel con luminance > 200 lo
// hacemos 100% transparente. Eso elimina del todo el "rectángulo" claro
// que se veía alrededor del logo.
const WHITE_THRESHOLD = 200;
// Píxeles intermedios (entre logo y blanco) → alpha proporcional. Suaviza
// los bordes sin dejar halo perceptible.
const FEATHER_FROM = 130;

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

(async () => {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    const o = i * 4;
    const lum = luminance(data[o], data[o + 1], data[o + 2]);
    if (lum >= WHITE_THRESHOLD) {
      data[o + 3] = 0;
    } else if (lum >= FEATHER_FROM) {
      // Rampa lineal: en FEATHER_FROM alpha=255, en WHITE_THRESHOLD alpha=0
      const t = (lum - FEATHER_FROM) / (WHITE_THRESHOLD - FEATHER_FROM);
      data[o + 3] = Math.round(255 * (1 - t));
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    // threshold agresivo en trim: cualquier alpha < 20 cuenta como transparente
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 20 })
    .resize({ width: 700, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(dst);

  const meta = await sharp(dst).metadata();
  console.log(`Wrote ${dst} (${meta.width}x${meta.height})`);
})();
