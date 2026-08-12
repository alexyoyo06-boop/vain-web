// Capa alto-nivel: fetch productos de Shopify y mapearlos a nuestro tipo Product.
// Convenciones para que el amigo no toque nada raro al añadir productos:
//   - Tipo de producto (productType) → categoría. Valores admitidos:
//       "Hoodie", "Hoodies"  → hoodies
//       "Tee", "T-Shirt", "Tees"  → tees
//       "Pants", "Pant", "Trousers"  → pants
//       "Headwear", "Hat", "Cap", "Beanie"  → headwear
//     Default → hoodies (no se pierde nada).
//   - "Colección" o tag "drop:Drop/01" → drop. Si no, usa productType o "Drop".
//     Mejor convención: poner el drop como TAG con formato "drop:Drop/01".
//   - Opción "Size" / "Talla" en variantes → tallas disponibles.
//   - Precio "compare-at" → oldPrice (precio tachado).
//
// Si la API falla o no hay token, devuelve [] (no crashea).

import "server-only";
import sanitizeHtml from "sanitize-html";
import { storefront } from "./client";
import { GET_PRODUCTS, GET_PRODUCT_BY_HANDLE } from "./queries";
import type {
  Product,
  ProductCategory,
  ProductSize,
  ProductPhoto,
} from "../products";

// --- Shopify response types ---

type Money = { amount: string; currencyCode: string };
type ImageNode = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};
type VariantNode = {
  id: string;
  title: string;
  availableForSale: boolean;
  /** Unidades que quedan. `null` si Shopify no lo comparte (falta el permiso
   *  de inventario en el token) o si esa variante no lleva stock controlado. */
  quantityAvailable: number | null;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  compareAtPrice: Money | null;
};
type ShopifyProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  tags: string[];
  availableForSale: boolean;
  featuredImage: ImageNode | null;
  images: { edges: { node: ImageNode }[] };
  options: { name: string; values: string[] }[];
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money };
  variants: { edges: { node: VariantNode }[] };
};

type ProductsResponse = {
  products: { edges: { node: ShopifyProduct }[] };
};
type ProductResponse = {
  product: ShopifyProduct | null;
};

// --- Mappers ---

const CATEGORY_MAP: Record<string, ProductCategory> = {
  // Inglés
  hoodie: "hoodies",
  hoodies: "hoodies",
  tee: "tees",
  tees: "tees",
  "t-shirt": "tees",
  tshirt: "tees",
  pant: "pants",
  pants: "pants",
  trouser: "pants",
  trousers: "pants",
  hat: "headwear",
  cap: "headwear",
  beanie: "headwear",
  headwear: "headwear",
  // Español (la tienda pone los tipos en castellano)
  camiseta: "tees",
  camisetas: "tees",
  pantalon: "pants",
  "pantalón": "pants",
  pantalones: "pants",
  short: "pants",
  shorts: "pants",
  sudadera: "hoodies",
  sudaderas: "hoodies",
  gorra: "headwear",
  gorras: "headwear",
  gorro: "headwear",
};

/**
 * Deriva la categoría a partir del productType (+ tags opcionales).
 * Expuesto para que el carrito pueda inferir la categoría sin tener que
 * remapear el producto entero. Default → hoodies (no se pierde nada).
 */
export function categoryFromType(
  productType: string,
  tags: string[] = [],
): ProductCategory {
  const key = productType.trim().toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  // También aceptamos tag "category:tees"
  for (const tag of tags) {
    const m = tag.toLowerCase().match(/^category:(.+)$/);
    if (m && CATEGORY_MAP[m[1]]) return CATEGORY_MAP[m[1]];
  }
  return "hoodies";
}

function inferCategory(p: ShopifyProduct): ProductCategory {
  return categoryFromType(p.productType, p.tags);
}

const HIDDEN_TAG_RE = /^(hidden|oculto)$/i;

function isHidden(p: ShopifyProduct): boolean {
  return p.tags.some((t) => HIDDEN_TAG_RE.test(t.trim()));
}

function inferDrop(p: ShopifyProduct): string {
  // Prioridad: tag "drop:..." > productType si contiene "Drop" > "Drop"
  for (const tag of p.tags) {
    const m = tag.match(/^drop:(.+)$/i);
    if (m) return m[1].trim();
  }
  if (/drop/i.test(p.productType)) return p.productType;
  return "Drop";
}

const SIZE_NAMES = new Set(["size", "talla", "tamaño", "tamano"]);
const VALID_SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL"];

/**
 * Convierte cualquier formato de talla de Shopify a nuestro tipo corto.
 * Acepta: "S", "Small", "SMALL", "L", "Large", "X-Large", "XL", etc.
 * Devuelve null si no reconoce el formato.
 */
export function normalizeSize(raw: string): ProductSize | null {
  const v = raw.trim().toUpperCase().replace(/[\s_-]+/g, "");
  switch (v) {
    case "XS":
    case "EXTRASMALL":
    case "XSMALL":
      return "XS";
    case "S":
    case "SMALL":
      return "S";
    case "M":
    case "MEDIUM":
    case "MED":
      return "M";
    case "L":
    case "LARGE":
      return "L";
    case "XL":
    case "XLARGE":
    case "EXTRALARGE":
      return "XL";
    default:
      return null;
  }
}

function inferSizes(p: ShopifyProduct): ProductSize[] {
  const sizeOption = p.options.find((o) => SIZE_NAMES.has(o.name.toLowerCase()));
  const seen = new Set<ProductSize>();
  const out: ProductSize[] = [];
  const push = (raw: string) => {
    const norm = normalizeSize(raw);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  };

  if (sizeOption) {
    for (const v of sizeOption.values) push(v);
  } else {
    // Fallback: leer de variantes si no hay option explícita
    for (const { node } of p.variants.edges) {
      for (const opt of node.selectedOptions) {
        if (SIZE_NAMES.has(opt.name.toLowerCase())) push(opt.value);
      }
    }
  }

  // Ordenar por talla canónica
  return out.sort((a, b) => VALID_SIZES.indexOf(a) - VALID_SIZES.indexOf(b));
}

/**
 * Tallas que de verdad se pueden comprar AHORA. Una talla aparece en `sizes`
 * (todas las tallas que el producto tiene) pero solo aparece aquí si su
 * variante en Shopify está marcada como `availableForSale: true`.
 * Permite que la UI tache las tallas sin stock.
 */
function inferAvailableSizes(p: ShopifyProduct): ProductSize[] {
  const seen = new Set<ProductSize>();
  const out: ProductSize[] = [];
  for (const { node } of p.variants.edges) {
    if (!node.availableForSale) continue;
    const sizeOpt = node.selectedOptions.find((o) =>
      SIZE_NAMES.has(o.name.toLowerCase()),
    );
    if (!sizeOpt) continue;
    const norm = normalizeSize(sizeOpt.value);
    if (norm && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out.sort((a, b) => VALID_SIZES.indexOf(a) - VALID_SIZES.indexOf(b));
}

/**
 * Cuántas unidades quedan de cada talla.
 *
 * Solo entran las tallas que Shopify comparte de verdad: si el token no tiene
 * el permiso de inventario, o esa variante no lleva el stock controlado,
 * `quantityAvailable` viene a `null` y la talla NO aparece en el mapa. Eso es
 * a propósito: es mejor no avisar de "quedan pocas" que inventarse un número.
 *
 * Tampoco entran las agotadas: para esas ya está el tachado, y un "quedan 0"
 * en rojo al lado de una talla tachada sobra.
 */
function inferSizeStock(p: ShopifyProduct): Partial<Record<ProductSize, number>> {
  const stock: Partial<Record<ProductSize, number>> = {};

  for (const { node } of p.variants.edges) {
    if (!node.availableForSale) continue;
    const qty = node.quantityAvailable;
    if (typeof qty !== "number" || !Number.isFinite(qty) || qty <= 0) continue;

    const sizeOpt = node.selectedOptions.find((o) =>
      SIZE_NAMES.has(o.name.toLowerCase()),
    );
    if (!sizeOpt) continue;
    const norm = normalizeSize(sizeOpt.value);
    if (!norm) continue;

    // Si dos variantes comparten talla (color + talla, por ejemplo), se suman:
    // lo que le importa a quien mira es cuántas puede comprar de esa talla.
    stock[norm] = (stock[norm] ?? 0) + qty;
  }

  return stock;
}

function imageToPhoto(img: ImageNode, fallbackAlt: string): ProductPhoto {
  return {
    src: img.url,
    alt: img.altText ?? fallbackAlt,
    width: img.width,
    height: img.height,
  };
}

function parsePrice(m: Money | undefined | null): number {
  if (!m) return 0;
  const n = Number.parseFloat(m.amount);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Sanitiza el HTML de descripción de Shopify antes de renderizarlo con
 * dangerouslySetInnerHTML. Defensa en profundidad: aunque la fuente
 * (Shopify Admin) es de confianza, si alguien comprometiese la cuenta
 * del amigo o si Shopify devolviese contenido inesperado, este filtro
 * elimina <script>, <iframe>, event handlers (onclick, etc.) y URIs
 * peligrosos (javascript:, data: en links).
 */
const ALLOWED_TAGS = [
  "p", "br", "ul", "ol", "li", "blockquote", "hr",
  "strong", "b", "em", "i", "u", "s", "code", "span",
  "h2", "h3", "h4",
  "a", "img",
];

function sanitizeProductHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title", "target"],
      img: ["src", "alt", "title"],
      span: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    // Fuerza rel="noopener noreferrer" en <a target="_blank"> para evitar
    // tabnabbing si Shopify devuelve un link externo.
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank"
            ? { rel: "noopener noreferrer" }
            : {}),
        },
      }),
    },
  });
}

function shortDescription(desc: string): string {
  const firstPara = desc.split(/\n\s*\n/)[0] ?? desc;
  if (firstPara.length <= 160) return firstPara.trim();
  return firstPara.slice(0, 157).trim() + "…";
}

export function mapShopifyProduct(p: ShopifyProduct): Product {
  const images = p.images.edges.map(({ node }) => node);
  const photos: ProductPhoto[] = (p.featuredImage
    ? [p.featuredImage, ...images.filter((i) => i.url !== p.featuredImage?.url)]
    : images
  ).map((img) => imageToPhoto(img, p.title));

  const primaryImage = p.featuredImage?.url ?? images[0]?.url ?? "";
  const hoverImage = images.find((i) => i.url !== primaryImage)?.url;

  const price = parsePrice(p.priceRange.minVariantPrice);
  const compareAt = parsePrice(p.compareAtPriceRange.minVariantPrice);
  const oldPrice = compareAt > price ? compareAt : undefined;

  return {
    slug: p.handle,
    category: inferCategory(p),
    name: p.title,
    drop: inferDrop(p),
    price,
    oldPrice,
    shortDescription: shortDescription(p.description),
    description: p.description,
    descriptionHtml: sanitizeProductHtml(p.descriptionHtml),
    sizes: inferSizes(p),
    sizesAvailable: inferAvailableSizes(p),
    sizeStock: inferSizeStock(p),
    primaryImage,
    hoverImage,
    photos,
    specs: [],
    details: p.description
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 120)
      .slice(0, 8),
    available: p.availableForSale,
    hidden: isHidden(p),
  };
}

// --- Public helpers ---

export async function fetchAllProducts(): Promise<Product[]> {
  const data = await storefront<ProductsResponse>(
    GET_PRODUCTS,
    { first: 50 },
    { tags: ["shopify", "shopify:products"], revalidate: 60 },
  );
  if (!data?.products) return [];
  return data.products.edges.map(({ node }) => mapShopifyProduct(node));
}

export async function fetchProductByHandle(
  handle: string,
): Promise<Product | null> {
  const data = await storefront<ProductResponse>(
    GET_PRODUCT_BY_HANDLE,
    { handle },
    {
      tags: ["shopify", `shopify:product:${handle}`],
      revalidate: 60,
    },
  );
  if (!data?.product) return null;
  return mapShopifyProduct(data.product);
}

/** Devuelve el variantId real de una talla del producto. Necesario para Cart API. */
export async function fetchVariantId(
  handle: string,
  size: ProductSize,
): Promise<string | null> {
  const data = await storefront<ProductResponse>(
    GET_PRODUCT_BY_HANDLE,
    { handle },
    {
      tags: ["shopify", `shopify:product:${handle}`],
      revalidate: 60,
    },
  );
  if (!data?.product) return null;
  for (const { node } of data.product.variants.edges) {
    const sizeOpt = node.selectedOptions.find((o) =>
      SIZE_NAMES.has(o.name.toLowerCase()),
    );
    // Comparamos por talla normalizada: "S" === normalizeSize("SMALL")
    if (sizeOpt && normalizeSize(sizeOpt.value) === size) {
      return node.id;
    }
  }
  // Fallback: si no hay opción Size, devuelve el primer variant disponible
  const first = data.product.variants.edges[0]?.node;
  return first?.id ?? null;
}
