// Server-only. Saca el ratio real "W / H" de una imagen en disco con sharp
// (el que ya trae Next para next/image). Respeta la orientación EXIF de las
// fotos de móvil. Si falla, devuelve el fallback. NO usar en cliente.

import "server-only";

export async function aspectOf(
  absPath: string,
  fallback = "3 / 4",
): Promise<string> {
  try {
    const sharp = (await import("sharp")).default;
    const m = await sharp(absPath).metadata();
    const rotated = (m.orientation ?? 1) >= 5;
    const w = rotated ? m.height : m.width;
    const h = rotated ? m.width : m.height;
    if (w && h) return `${w} / ${h}`;
  } catch {
    // cae al fallback
  }
  return fallback;
}
