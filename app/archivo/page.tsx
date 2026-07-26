import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ArchiveGallery from "@/components/ArchiveGallery";
import { getArchiveShots } from "@/lib/archive-server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.meta.archiveTitle, description: t.meta.archiveDescription };
}

// El archivo ("Gente con VAIN" / UGC) usa SOLO las fotos de
// `vain-web/public/archivo/` (ver getArchiveShots en lib/archive-server).
export default async function ArchivoPage() {
  const shots = await getArchiveShots();

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ArchiveGallery shots={shots} />
      <Footer />
    </main>
  );
}
