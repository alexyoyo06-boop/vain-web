import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import CompleteTrio from "@/components/CompleteTrio";
import {
  formatPrice,
  isProductCategory,
  productHref,
  type Product,
} from "@/lib/products";
import { getAvailableProducts, getProduct } from "@/lib/products-server";
import { LOCALES } from "@/lib/i18n/config";
import { TRIPLET_ORDER, tripletColor } from "@/lib/triplet-theme";
import { localeParam } from "@/lib/i18n/params";

// Ruta única de ficha de producto: /{categoria}/{slug}.
// La categoría va en la URL (hoodies, tees, pants, headwear). Los enlaces
// antiguos /hoodies/{slug} de cualquier producto siguen funcionando: la ruta
// acepta cualquier categoría válida y el canonical apunta a la categoría real
// del producto, así que el SEO se auto-corrige.

type Params = { locale: string; category: string; slug: string };

/**
 * Una copia por producto Y POR IDIOMA. Son 11 veces más páginas que antes, y
 * es exactamente el objetivo: cada una se genera una sola vez al desplegar y
 * luego se sirve ya hecha, sin gastar CPU en cada visita.
 *
 * Cuestan build, no runtime. Y el build lo paga Vercel aparte de la cuota de
 * CPU de las funciones, que era la que se estaba agotando.
 */
export async function generateStaticParams(): Promise<Params[]> {
  const products = await getAvailableProducts();
  return LOCALES.flatMap((locale) =>
    products.map((p) => ({ locale, category: p.category, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale, category, slug } = await params;
  const locale = localeParam(rawLocale);
  if (!isProductCategory(category)) return {};
  const product = await getProduct(slug);
  if (!product) return {};

  const title = `${product.name} — VAIN`;
  const description = `${product.shortDescription} ${formatPrice(product.price, locale)}.`;
  // Canónica = categoría REAL del producto, aunque se acceda por otra.
  const url = productHref(product);
  // La foto que sale al compartir la ficha, con el producto y su precio. Se
  // declara a mano (y no la detecta Next sola) porque el fichero que la dibuja
  // vive fuera del árbol de idiomas — ver app/[category]/[slug]/opengraph-image
  // .tsx. Cuelga de la canónica, así que la URL sale limpia: /pants/gris/…
  const ogImage = {
    url: `${url}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: product.name,
    type: "image/png",
  };

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "VAIN",
      locale: locale === "en" ? "en_US" : "es_ES",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale, category, slug } = await params;
  const locale = localeParam(rawLocale);
  if (!isProductCategory(category)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();

  // Si es un pantalón de la cápsula triplet, resolvemos los otros dos hermanos
  // para la sección "Completa tu trío". Para el resto de productos queda vacía.
  const trio: Product[] = tripletColor(product.slug)
    ? (
        await Promise.all(
          TRIPLET_ORDER.filter((h) => h !== product.slug).map((h) => getProduct(h)),
        )
      ).filter((p): p is Product => p !== null && p.available)
    : [];

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductDetail product={product} />
      <CompleteTrio products={trio} locale={locale} />
      <Footer />
    </main>
  );
}
