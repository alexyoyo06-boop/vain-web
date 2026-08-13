import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ArchiveGallery from "@/components/ArchiveGallery";
import { getArchiveShots } from "@/lib/archive-server";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localeParam } from "@/lib/i18n/params";


type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const locale = localeParam((await params).locale);
  const t = await getDictionary(locale);
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
