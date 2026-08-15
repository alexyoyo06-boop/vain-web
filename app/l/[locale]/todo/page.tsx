import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getVisibleProducts } from "@/lib/products-server";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localeParam } from "@/lib/i18n/params";


type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const locale = localeParam((await params).locale);
  const t = await getDictionary(locale);
  return { title: t.meta.todoTitle, description: t.meta.todoDescription };
}

export default async function TodoPage({ params }: Params) {
  const locale = localeParam((await params).locale);
  const t = await getDictionary(locale);
  // `getVisibleProducts` y no `getAvailableProducts`: en el catálogo los
  // agotados TIENEN que seguir saliendo, con su foto y su etiqueta de
  // "Agotado". Si no, el día que se agota el drop esta página se queda vacía y
  // la tienda parece abandonada — que es justo lo que pasó en la portada con el
  // pantalón gris (ver el porqué largo en lib/products-server.ts).
  const products = await getVisibleProducts();

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
