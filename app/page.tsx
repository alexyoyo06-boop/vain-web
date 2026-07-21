import Nav from "@/components/NavServer";
import PhotoHero from "@/components/PhotoHero";
import TripletsHero from "@/components/TripletsHero";
import Hero from "@/components/Hero";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";
import { getAvailableProducts, getLatestDropProducts } from "@/lib/products-server";

export default async function Home() {
  // Hero = el drop más reciente (automático). Si ese drop trae varios
  // productos (p. ej. un mismo modelo en varios colores), el primero
  // protagoniza la portada. El catálogo completo vive en /todo, no en la home.
  const all = await getAvailableProducts();
  const latestDrop = await getLatestDropProducts();
  const featured = latestDrop[0] ?? all[0];

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <PhotoHero />
      <TripletsHero products={all} />
      <Hero product={featured} />
      <TrustStrip />
      <Footer />
    </main>
  );
}
