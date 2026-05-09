import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HoodiesGrid from "@/components/HoodiesGrid";

export const metadata = {
  title: "VAIN — Hoodies",
  description: "Todos los hoodies de VAIN. Drops limitados, calidad real.",
};

export default function HoodiesPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <HoodiesGrid />
      <Footer />
    </main>
  );
}
