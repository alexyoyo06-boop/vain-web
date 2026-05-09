import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";

export const metadata = {
  title: "VAIN — Plaid Hoodie",
  description: "Plaid Hoodie de VAIN. 480gsm, algodón orgánico, made in Spain.",
};

export default function PlaidHoodiePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductDetail />
      <Footer />
    </main>
  );
}
