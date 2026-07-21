import Nav from "@/components/NavServer";
import PhotoHero from "@/components/PhotoHero";
import TripletsHero from "@/components/TripletsHero";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";
import { getAvailableProducts, getLatestDropProducts } from "@/lib/products-server";
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
  // Hero = el drop más reciente (automático). Si ese drop trae varios
  // productos (p. ej. un mismo modelo en varios colores), la portada los va
  // rotando para que no salga siempre el mismo. El catálogo completo vive en
  // /todo, no en la home.
  const all = await getAvailableProducts();
  const latestDrop = await getLatestDropProducts();
  const pool = latestDrop.length > 0 ? latestDrop : all.slice(0, 1);
  // Solo rotan entre sí las prendas del mismo tipo que la protagonista (los
  // tres pantalones del drop), no el resto de piezas del drop.
  const featured = pool.filter((p) => p.category === pool[0]?.category);

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <PhotoHero />
      <TripletsHero products={all} />
      <Hero products={featured} />
      <TrustStrip />
      <Footer />
    </main>
  );
}
