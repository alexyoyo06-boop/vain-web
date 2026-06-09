import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getCollection } from "@/lib/products-server";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t.meta.newDropTitle, description: t.meta.newDropDescription };
}

// Handles aceptados para la colección "Nuevo Drop" en Shopify.
// Primero que encuentre, gana. Si ninguna existe o están vacías,
// se muestra estado vacío — control total para el merchant.
const NUEVO_DROP_HANDLES = ["nuevo-drop", "new-drop", "drop-actual"];

export default async function NuevoDropPage() {
  const { t } = await getT();
  let products: Awaited<ReturnType<typeof getCollection>> = null;
  for (const handle of NUEVO_DROP_HANDLES) {
    const col = await getCollection(handle);
    if (col) {
      products = col;
      break;
    }
  }

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductsGrid
        eyebrow={t.pages.newDropEyebrow}
        title={t.pages.newDropTitle}
        description={products?.description || t.pages.newDropDescription}
        products={products?.products ?? []}
      />
      <Footer />
    </main>
  );
}
