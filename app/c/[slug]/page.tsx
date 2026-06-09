import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/NavServer";
import Footer from "@/components/Footer";
import ProductsGrid from "@/components/ProductsGrid";
import { getCollection, getCollections } from "@/lib/products-server";
import { getT } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/dictionary";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  const { t } = await getT();
  return {
    title: `${collection.title} — VAIN`,
    description:
      collection.description ||
      tpl(t.meta.collectionFallback, { title: collection.title }),
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) notFound();
  const { t } = await getT();

  return (
    <main className="flex flex-col min-h-screen">
      <Nav />
      <ProductsGrid
        eyebrow={t.pages.collectionEyebrow}
        title={collection.title}
        description={collection.description || undefined}
        products={collection.products}
        emptyMessage={t.pages.collectionEmpty}
      />
      <Footer />
    </main>
  );
}
