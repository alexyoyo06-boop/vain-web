import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getCollection } from "@/lib/products-server";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localeParam } from "@/lib/i18n/params";


type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const locale = localeParam((await params).locale);
  const t = await getDictionary(locale);
  return { title: t.meta.newDropTitle, description: t.meta.newDropDescription };
}

// Handles aceptados para la colección "Nuevo Drop" en Shopify.
// Primero que encuentre, gana. Si ninguna existe o están vacías,
// se muestra estado vacío — control total para el merchant.
const NUEVO_DROP_HANDLES = ["nuevo-drop", "new-drop", "drop-actual"];

export default async function NuevoDropPage({ params }: Params) {
  const locale = localeParam((await params).locale);
  const t = await getDictionary(locale);
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
