import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getAvailableProducts } from "@/lib/products-server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.meta.todoTitle, description: t.meta.todoDescription };
}

export default async function TodoPage() {
  const { t } = await getT();
  const products = await getAvailableProducts();

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductsGrid
        eyebrow={t.pages.allEyebrow}
        title={t.pages.allTitle}
        description={t.pages.allDescription}
        products={products}
      />
      <Footer />
    </main>
  );
}
