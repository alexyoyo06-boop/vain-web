// Colecciones de Shopify → secciones dinámicas del menú lateral.
// Si el amigo crea una colección en Shopify Admin → aparece sola en la web.

import "server-only";
import { storefront } from "./client";
import { GET_COLLECTIONS, GET_COLLECTION_BY_HANDLE } from "./queries";
import { mapShopifyProduct } from "./products";
import type { Product } from "../products";

export type Collection = {
  handle: string;
  title: string;
  description: string;
  image?: { src: string; alt: string };
};

export type CollectionWithProducts = Collection & {
  products: Product[];
};

type CollectionNode = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: { url: string; altText: string | null } | null;
};

type CollectionsResponse = {
  collections: { edges: { node: CollectionNode }[] };
};

type CollectionDetailResponse = {
  collection:
    | (CollectionNode & {
        products: { edges: { node: Parameters<typeof mapShopifyProduct>[0] }[] };
      })
    | null;
};

function mapCollection(c: CollectionNode): Collection {
  return {
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: c.image
      ? { src: c.image.url, alt: c.image.altText ?? c.title }
      : undefined,
  };
}

export async function fetchCollections(): Promise<Collection[]> {
  const data = await storefront<CollectionsResponse>(
    GET_COLLECTIONS,
    { first: 30 },
    { tags: ["shopify", "shopify:collections"] },
  );
  if (!data?.collections) return [];
  return data.collections.edges.map(({ node }) => mapCollection(node));
}

export async function fetchCollectionByHandle(
  handle: string,
): Promise<CollectionWithProducts | null> {
  const data = await storefront<CollectionDetailResponse>(
    GET_COLLECTION_BY_HANDLE,
    { handle },
    {
      tags: ["shopify", `shopify:collection:${handle}`],
    },
  );
  if (!data?.collection) return null;
  return {
    ...mapCollection(data.collection),
    products: data.collection.products.edges.map(({ node }) =>
      mapShopifyProduct(node),
    ),
  };
}
