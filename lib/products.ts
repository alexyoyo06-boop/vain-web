// Tipos + utilidades síncronas. SAFE de importar desde Client Components.
// Para fetchear datos reales de Shopify, usa lib/products-server.ts (server-only).

export type ProductSize = "XS" | "S" | "M" | "L" | "XL";
export type ProductCategory = "hoodies" | "tees" | "pants" | "headwear";

export type ProductPhoto = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type Product = {
  slug: string;
  category: ProductCategory;
  name: string;
  drop: string;
  price: number;
  oldPrice?: number;
  shortDescription: string;
  description: string;
  /**
   * Descripción tal cual viene de Shopify (con <p>, <ul>, <strong>, etc).
   * Se renderiza con dangerouslySetInnerHTML — es seguro porque la fuente
   * es Shopify Admin, no input de usuarios. Para SEO/OG usa `description`.
   */
  descriptionHtml: string;
  sizes: ProductSize[];
  /**
   * Tallas que están actualmente comprables (tienen stock o el merchant
   * permite seguir vendiendo sin stock). Si no aparece aquí, en la UI se
   * pinta tachada/disabled.
   */
  sizesAvailable: ProductSize[];
  primaryImage: string;
  hoverImage?: string;
  photos: ProductPhoto[];
  modelHeight?: string;
  modelSize?: ProductSize;
  specs: { k: string; v: string }[];
  details: string[];
  available: boolean;
  /**
   * El producto tiene tag `hidden` (o `oculto`) en Shopify. Se excluye de
   * listados públicos como `/todo`, `/hoodies`, home. Sigue accesible por
   * URL directa y por colecciones que lo incluyan explícitamente.
   */
  hidden: boolean;
  /** Override del ratio H/W de la foto principal en la OG image. Default 1.2 */
  ogPhotoAspect?: number;
};

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

/** Categorías válidas como segmento de URL. */
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "hoodies",
  "tees",
  "pants",
  "headwear",
];

export function isProductCategory(value: string): value is ProductCategory {
  return (PRODUCT_CATEGORIES as string[]).includes(value);
}

/**
 * URL canónica de la ficha de un producto: `/{categoria}/{slug}`.
 * Única fuente de verdad para los enlaces a producto — así la categoría
 * va siempre en la URL. Los enlaces antiguos `/hoodies/{slug}` siguen
 * funcionando porque la ruta [category] acepta cualquier categoría válida.
 */
export function productHref(p: Pick<Product, "category" | "slug">): string {
  return `/${p.category}/${p.slug}`;
}
