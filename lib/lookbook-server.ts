// Server-only. Lee las fotos del lookbook de la home desde disco.
// NO importar desde Client Components.

import "server-only";
import fs from "node:fs";
import path from "node:path";

const IMG_RE = /\.(jpe?g|png|webp|avif)$/i;

export type LookbookShot = {
  src: string;
  /** Ratio real de la foto, "W / H", para respetar horizontal/vertical. */
  aspect: string;
};

/**
 * Fotos de la tira "Archivo" de la home ("gente con VAIN" en la calle). Salen
 * SOLO las que dejéis en `vain-web/public/lookbook/`. Se ordenan por nombre
 * (usa prefijos 01_, 02_… si quieres mandar el orden). Cada foto conserva su
 * proporción real (las horizontales salen anchas y las verticales altas), así
 * que da igual mezclar formatos. Carpeta vacía = no se muestra la sección.
 */
export async function getLookbookShots(): Promise<LookbookShot[]> {
  const dir = path.join(process.cwd(), "public", "lookbook");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir).filter((f) => IMG_RE.test(f)).sort();
  } catch {
    return [];
  }
  // sharp ya viene con Next (lo usa next/image). Import dinámico para que no
  // acabe en ningún bundle de cliente. Respeta la orientación EXIF de las
  // fotos de móvil (si no, una vertical girada saldría con el ratio cambiado).
  // Si por lo que sea no cargara, las fotos salen igual con ratio 3/2.
  const sharpMod = await import("sharp").catch(() => null);
  if (!sharpMod) {
    return files.map((f) => ({ src: `/lookbook/${f}`, aspect: "3 / 2" }));
  }
  const sharp = sharpMod.default;
  return Promise.all(
    files.map(async (f) => {
      let aspect = "3 / 2";
      try {
        const m = await sharp(path.join(dir, f)).metadata();
        const rotated = (m.orientation ?? 1) >= 5;
        const w = rotated ? m.height : m.width;
        const h = rotated ? m.width : m.height;
        if (w && h) aspect = `${w} / ${h}`;
      } catch {
        // Si sharp falla, cae a 3/2 (el formato de la mayoría).
      }
      return { src: `/lookbook/${f}`, aspect };
    }),
  );
}
