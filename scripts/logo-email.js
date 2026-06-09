// Genera public/logo_2.png para usar en el header del email de Shopify.
// El logo VAIN normal (logo2.png) es negro sobre alpha; Shopify a veces
// lo previsualiza encima de un wrapper oscuro y se hace invisible. Aquí
// lo plantamos encima de un fondo bone opaco con padding, así es legible
// en cualquier contexto (light, dark, editor de Shopify).

const path = require("node:path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "public", "logo2.png");
const DST = path.join(__dirname, "..", "public", "logo_2.png");

const BG = { r: 245, g: 240, b: 230, alpha: 1 }; // #F5F0E6 bone
const OUT_W = 800;
const OUT_H = 400;
const PADDING = 60;

(async () => {
  const fit = await sharp(SRC)
    .resize({
      width: OUT_W - PADDING * 2,
      height: OUT_H - PADDING * 2,
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: fit, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(DST);

  console.log(`Wrote ${DST} (${OUT_W}x${OUT_H} sobre bone #F5F0E6)`);
})();
