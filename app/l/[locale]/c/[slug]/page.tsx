import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getCollection, getCollections } from "@/lib/products-server";
import { LOCALES } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { collectionLabel } from "@/lib/collection-label";
import { tpl } from "@/lib/i18n/dictionary";
import { localeParam } from "@/lib/i18n/params";

type Params = { locale: string; slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const collections = await getCollections();
  // Una copia por colección y por idioma: ver el porqué en la ficha de
  // producto (app/l/[locale]/[category]/[slug]/page.tsx).
  return LOCALES.flatMap((locale) =>
    collections.map((c) => ({ locale, slug: c.handle })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = localeParam(rawLocale);
  const collection = await getCollection(slug);
  if (!collection) return {};
  const t = await getDictionary(locale);
  const title = collectionLabel(t, slug, collection.title);
  return {
    title: `${title} — VAIN`,
    description:
      collection.description ||
      tpl(t.meta.collectionFallback, { title }),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = localeParam(rawLocale);
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const t = await getDictionary(locale);

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductsGrid
        eyebrow={t.pages.collectionEyebrow}
        title={collectionLabel(t, slug, collection.title)}
        description={collection.description || undefined}
        products={collection.products}
        emptyMessage={t.pages.collectionEmpty}
      />
      <Footer />
    </main>
  );
}
