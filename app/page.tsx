import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ProductShowcase from "@/components/ProductShowcase";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <Hero />
      <Categories />
      <ProductShowcase />
      <TrustStrip />
      <Footer />
    </main>
  );
}
