import Nav from "@/components/NavServer";
import PhotoHero from "@/components/PhotoHero";
import TripletsHero from "@/components/TripletsHero";
import Lookbook from "@/components/Lookbook";
import Footer from "@/components/Footer";
import { getVisibleProducts } from "@/lib/products-server";
import { getLookbookShots } from "@/lib/lookbook-server";
import { getT } from "@/lib/i18n/server";

/**
 * Al compartir la portada, el texto que acompaña a la imagen habla del drop
 * vigente ("The Triplets Drop · Ya disponible"), no solo del nombre de la
 * marca. La imagen la genera `app/opengraph-image.tsx`.
 */
export async function generateMetadata() {
  const { t } = await getT();
  const title = `VAIN — ${t.nav.newDrop}`;
  const description = `${t.meta.ogOutNow} · ${t.meta.ogDescription}`;
  return {
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function Home() {
  // TripletsHero (arriba) ya enseña los tres pantalones del drop. Debajo, en
  // vez del antiguo Hero rotatorio, va la tira "Archivo" con fotos de gente
  // llevando VAIN en la calle. El catálogo completo vive en /todo.
  // `getVisibleProducts` y no `getAvailableProducts`: los agotados TIENEN que
  // seguir saliendo en la portada con su foto. Si no, el triplet que se agota
  // desaparece del escaparate y en su hueco sale el placeholder de "Pronto."
  // (ver el porqué largo en lib/products-server.ts).
  const all = await getVisibleProducts();
  // La sección Archivo de la home enseña 4 fotos en cuadrícula. Son las que
  // dejéis en `public/lookbook/` con los nombres 1,2,3,4 (.jpg). El archivo
  // completo (todas las fotos) vive en /archivo.
  const lookbook = await getLookbookShots();

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <PhotoHero />
      <TripletsHero products={all} />
      <Lookbook shots={lookbook} />
      <Footer />
    </main>
  );
}
