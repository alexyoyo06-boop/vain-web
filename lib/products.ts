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
  /**
   * Unidades que quedan, por talla. Solo aparecen las tallas de las que
   * Shopify nos da el dato: si falta el permiso de inventario en el token, o
   * la variante no lleva stock controlado, esa talla no está aquí y la UI
   * simplemente no avisa de "quedan pocas". Nunca se inventa un número.
   */
  sizeStock?: Partial<Record<ProductSize, number>>;
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

/**
 * Etiqueta BCP-47 con la que formatear precios en cada idioma. Casi siempre
 * es el propio locale; la excepción es el árabe, donde forzamos dígitos
 * latinos (`-u-nu-latn`): por defecto Intl pinta ٢٩٫٠٠ y en esta web el
 * precio es un número grande de display que tiene que leerse igual que en el
 * resto de idiomas.
 */
const PRICE_LOCALE: Record<string, string> = {
  ar: "ar-u-nu-latn",
};

/**
 * Precio en euros formateado según el idioma del visitante: "29,00 €" en
 * español, "€29.00" en inglés. Sin `locale` cae al español, que es lo que
 * necesitan los sitios sin contexto de idioma (OG images, metadata).
 */
export function formatPrice(n: number, locale = "es"): string {
  return new Intl.NumberFormat(PRICE_LOCALE[locale] ?? locale, {
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

/**
 * A partir de cuántas unidades se avisa de "quedan pocas".
 *
 * Tres es el punto donde el aviso todavía es verdad y sirve de empujón. Más
 * alto y se convierte en ruido que nadie cree; más bajo y casi nunca sale.
 * Si algún día el drop es de tiradas más grandes, se sube aquí y ya está.
 */
export const LOW_STOCK_THRESHOLD = 3;

/**
 * ¿Quedan pocas unidades de esta talla?
 *
 * Devuelve `false` cuando no se sabe: si Shopify no comparte el inventario
 * (falta el permiso en el token) o esa talla no lleva stock controlado, el
 * dato no existe y NO se avisa. Prefiero no decir nada a inventarme una
 * urgencia — un "quedan pocas" falso se nota y quema la confianza.
 */
export function isLowStock(product: Product, size: ProductSize): boolean {
  const quedan = product.sizeStock?.[size];
  return (
    typeof quedan === "number" &&
    Number.isFinite(quedan) &&
    quedan > 0 &&
    quedan <= LOW_STOCK_THRESHOLD
  );
}
