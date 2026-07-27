import { notFound, redirect } from "next/navigation";
import { productHref } from "@/lib/products";
import { getProduct } from "@/lib/products-server";

// URL de producto al estilo Shopify: /products/{handle}. No es la ruta de esta
// web (la nuestra es /{categoria}/{slug}), pero es la que quedó pegada en
// TikToks y en el índice de Google de cuando v4in.com apuntaba a la tienda
// Shopify — y la que genera Shopify si algo enlaza un producto desde su lado.
// Antes daba 404; ahora resolvemos el handle y mandamos a la ficha real.
// No lleva metadata a propósito: nadie debe indexar esta ruta, solo rebotar.

export default async function LegacyProductUrl({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProduct(handle);
  // Handle que ya no existe en Shopify → 404 de marca, como cualquier ficha
  // borrada. No inventamos un destino.
  if (!product) notFound();
  redirect(productHref(product));
}
