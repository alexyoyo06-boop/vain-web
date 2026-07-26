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
import { getLocale } from "@/lib/i18n/server";
import { TRIPLET_ORDER, tripletColor } from "@/lib/triplet-theme";

// Ruta única de ficha de producto: /{categoria}/{slug}.
// La categoría va en la URL (hoodies, tees, pants, headwear). Los enlaces
// antiguos /hoodies/{slug} de cualquier producto siguen funcionando: la ruta
// acepta cualquier categoría válida y el canonical apunta a la categoría real
// del producto, así que el SEO se auto-corrige.

type Params = { category: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const products = await getAvailableProducts();
  return products.map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  if (!isProductCategory(category)) return {};
  const product = await getProduct(slug);
  if (!product) return {};

  const locale = await getLocale();
  const title = `${product.name} — VAIN`;
  const description = `${product.shortDescription} ${formatPrice(product.price, locale)}.`;
  // Canónica = categoría REAL del producto, aunque se acceda por otra.
  const url = productHref(product);

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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { category, slug } = await params;
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
      <CompleteTrio products={trio} />
      <Footer />
    </main>
  );
}
