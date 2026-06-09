import Nav from "@/components/NavServer";
import TripletsHero from "@/components/TripletsHero";
import Hero from "@/components/Hero";
import ShopGrid from "@/components/ShopGrid";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";
import { getAvailableProducts, getLatestDropProducts } from "@/lib/products-server";

export default async function Home() {
  // Hero = el drop más reciente (automático). Si ese drop trae varios
  // productos (p. ej. un mismo modelo en varios colores), el primero
  // protagoniza la portada. Debajo, la rejilla con TODA la ropa disponible.
  const all = await getAvailableProducts();
  const latestDrop = await getLatestDropProducts();
  const featured = latestDrop[0] ?? all[0];

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <TripletsHero products={all} />
      <Hero product={featured} />
      <ShopGrid products={all} />
      <TrustStrip />
      <Footer />
    </main>
  );
}
