import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, "../public/logo_index.jpg");
const dst = resolve(__dirname, "../public/logo_index.png");

const img = sharp(src).ensureAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });

const out = Buffer.from(data);
const threshold = 235;
for (let i = 0; i < out.length; i += 4) {
  const r = out[i], g = out[i + 1], b = out[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    out[i + 3] = 0;
  } else {
    const min = Math.min(r, g, b);
    if (min > 200) {
      out[i + 3] = Math.round(((255 - min) / (255 - 200)) * 255);
    }
  }
}

await sharp(out, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 1 })
  .png({ compressionLevel: 9 })
  .toFile(dst);

console.log("wrote", dst);
