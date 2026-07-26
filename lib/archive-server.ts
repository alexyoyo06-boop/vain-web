// Server-only. Lee las fotos del archivo ("gente con VAIN") desde disco.
// Fuente única para la página /archivo y para la sección Archivo de la home.
// NO importar desde Client Components.

import "server-only";
import fs from "node:fs";
import path from "node:path";
import { aspectOf } from "./image-aspect";
import type { Shot } from "@/components/ArchiveGallery";

const IMG_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

/**
 * Fotos del archivo. Salen SOLO las que dejéis en `vain-web/public/archivo/`,
 * ordenadas por nombre (usa prefijos 01, 02… para mandar el orden). Cada foto
 * lleva su ratio real (para el masonry de /archivo). Carpeta vacía = [].
 */
export async function getArchiveShots(): Promise<Shot[]> {
  const dir = path.join(process.cwd(), "public", "archivo");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  const names = files.filter((f) => IMG_RE.test(f)).sort();
  return Promise.all(
    names.map(async (f) => ({
      src: `/archivo/${f}`,
      alt: "VAIN",
      aspect: await aspectOf(path.join(dir, f)),
    })),
  );
}
