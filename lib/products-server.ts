// Server-only. Async fetches a Shopify. NO importar desde Client Components.

import "server-only";
import {
  fetchAllProducts,
  fetchProductByHandle,
} from "./shopify/products";
import {
  fetchCollections,
  fetchCollectionByHandle,
  type Collection,
  type CollectionWithProducts,
} from "./shopify/collections";
import type { Product, ProductCategory } from "./products";

export type { Collection, CollectionWithProducts };

export async function getCollections(): Promise<Collection[]> {
  return fetchCollections();
}

export async function getCollection(
  handle: string,
): Promise<CollectionWithProducts | null> {
  return fetchCollectionByHandle(handle);
}

export async function getProduct(slug: string): Promise<Product | null> {
  return fetchProductByHandle(slug);
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchAllProducts();
}

/**
 * Productos visibles públicamente: disponibles + no etiquetados como `hidden`
 * o `oculto` en Shopify. Es lo que usan los listados generales (`/todo`,
 * home, etc.). Una colección que incluya explícitamente un producto hidden
 * SÍ lo mostrará — el filtro se aplica solo aquí.
 */
export async function getAvailableProducts(): Promise<Product[]> {
  const all = await fetchAllProducts();
  return all.filter((p) => p.available && !p.hidden);
}

/**
 * Productos que se ENSEÑAN aunque estén agotados: solo se quitan los ocultos.
 *
 * `getAvailableProducts()` tira también los agotados, y para un listado general
 * está bien. Pero en la portada no: los tres triplets son el escaparate del
 * drop, y cuando uno se agota desaparecía de la lista, TripletsHero no lo
 * encontraba y pintaba en su hueco el placeholder de "Pronto." con el logo.
 * O sea que el pantalón que MÁS se ha vendido era el único que dejaba de
 * enseñar su foto — justo al revés de lo que interesa. Agotado se enseña, con
 * su foto y su etiqueta de "Agotado", que además crea urgencia en los otros.
 */
export async function getVisibleProducts(): Promise<Product[]> {
  const all = await fetchAllProducts();
  return all.filter((p) => !p.hidden);
}

export async function getProductsByCategory(
  category: ProductCategory,
): Promise<Product[]> {
  const all = await fetchAllProducts();
  return all.filter((p) => p.category === category && !p.hidden);
}

/**
 * Drop más reciente = el drop del producto subido más recientemente a Shopify.
 * `getAvailableProducts()` mantiene el orden de la query (CREATED_AT desc), así
 * que el primer producto es el más nuevo y su `drop` es el drop vigente. Es
 * cronológico, no alfabético: da igual cómo se llame el drop ("V TRIPLETS",
 * "Drop/07"…), el que subas último manda. Requisito: todos los productos de un
 * mismo drop comparten el mismo tag `drop:<nombre>` en Shopify.
 */
export async function getLatestDrop(): Promise<string | null> {
  const available = await getAvailableProducts();
  return available[0]?.drop ?? null;
}

export async function getLatestDropProducts(): Promise<Product[]> {
  const latest = await getLatestDrop();
  if (!latest) return [];
  const available = await getAvailableProducts();
  return available.filter((p) => p.drop === latest);
}
