import fs from "node:fs";
import path from "node:path";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ArchiveGallery, { type Shot } from "@/components/ArchiveGallery";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.meta.archiveTitle, description: t.meta.archiveDescription };
}

const IMG_RE = /\.(jpe?g|png|webp|avif|gif)$/i;

// El archivo ("Gente con VAIN" / UGC) NO usa fotos de Shopify a propósito:
// usa SOLO las que subáis a `vain-web/public/archivo/`. Así controláis
// exactamente qué sale (por si Shopify trae fotos que no queréis ahí).
// Para añadir: deja las imágenes en esa carpeta. Se ordenan por nombre
// (usa prefijos 01_, 02_… si quieres mandar el orden). Vacío = galería
// vacía (solo el bloque de "etiquétanos en Instagram").
function getArchiveShots(): Shot[] {
  const dir = path.join(process.cwd(), "public", "archivo");
  let files: string[] = [];
  try {
    files = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return files
    .filter((f) => IMG_RE.test(f))
    .sort()
    .map((f) => ({ src: `/archivo/${f}`, alt: "VAIN", aspect: "3/4" }));
}

export default async function ArchivoPage() {
  const shots = getArchiveShots();

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ArchiveGallery shots={shots} />
      <Footer />
    </main>
  );
}
