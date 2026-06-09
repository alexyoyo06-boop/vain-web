import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductDetail from "@/components/ProductDetail";
import { formatPrice, isProductCategory, productHref } from "@/lib/products";
import { getAvailableProducts, getProduct } from "@/lib/products-server";
import { getLocale } from "@/lib/i18n/server";

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

  const title = `${product.name} — VAIN`;
  const description = `${product.shortDescription} ${formatPrice(product.price)}.`;
  const locale = await getLocale();
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

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductDetail product={product} />
      <Footer />
    </main>
  );
}
