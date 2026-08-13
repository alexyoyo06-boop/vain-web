import type { Metadata } from "next";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Cesta — VAIN",
  description: "Tu cesta de compra en VAIN.",
};

export default async function CartPage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <CartView />
      <Footer />
    </main>
  );
}
