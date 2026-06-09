// Capa de carrito con Shopify Cart API. Server-only.

import "server-only";
import { storefront } from "./client";
import { categoryFromType, normalizeSize } from "./products";
import type { ProductCategory } from "../products";
import {
  CART_CREATE,
  CART_GET,
  CART_LINES_ADD,
  CART_LINES_REMOVE,
  CART_LINES_UPDATE,
} from "./queries";

export type CartLine = {
  lineId: string;
  variantId: string;
  productHandle: string;
  /** Categoría del producto — para construir el enlace `/{categoria}/{slug}`. */
  category: ProductCategory;
  productTitle: string;
  variantTitle: string;
  size: string;
  price: number;
  image: string;
  imageAlt: string;
  qty: number;
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  total: number;
  currency: string;
  lines: CartLine[];
};

// --- Shopify response types ---

type ShopifyMoney = { amount: string; currencyCode: string };
type ShopifyCartLineNode = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    selectedOptions: { name: string; value: string }[];
    price: ShopifyMoney;
    image: { url: string; altText: string | null } | null;
    product: { handle: string; title: string; productType: string };
  };
};
type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  lines: { edges: { node: ShopifyCartLineNode }[] };
};

const SIZE_NAMES = new Set(["size", "talla", "tamaño", "tamano"]);

function moneyToNumber(m: ShopifyMoney | undefined | null): number {
  if (!m) return 0;
  const n = Number.parseFloat(m.amount);
  return Number.isFinite(n) ? n : 0;
}

function mapLine(node: ShopifyCartLineNode): CartLine {
  const sizeOpt = node.merchandise.selectedOptions.find((o) =>
    SIZE_NAMES.has(o.name.toLowerCase()),
  );
  // Normalizamos para mostrar siempre "S", "M", "L"… en la cesta, aunque
  // Shopify guarde "SMALL"/"Large"/etc.
  const sizeDisplay = sizeOpt ? normalizeSize(sizeOpt.value) ?? sizeOpt.value : "";
  return {
    lineId: node.id,
    variantId: node.merchandise.id,
    productHandle: node.merchandise.product.handle,
    category: categoryFromType(node.merchandise.product.productType),
    productTitle: node.merchandise.product.title,
    variantTitle: node.merchandise.title,
    size: sizeDisplay,
    price: moneyToNumber(node.merchandise.price),
    image: node.merchandise.image?.url ?? "",
    imageAlt: node.merchandise.image?.altText ?? node.merchandise.product.title,
    qty: node.quantity,
  };
}

function mapCart(c: ShopifyCart): Cart {
  // Defensive: Shopify a veces devuelve líneas con qty 0 cuando la variante
  // no tiene stock y el merchant tiene "Track quantity" sin "Continue selling
  // when out of stock". Si las dejamos pasan a la UI y aparecen líneas
  // fantasma con precio 0. El error se muestra a nivel de ficha (talla
  // disabled), aquí simplemente las descartamos.
  const lines = c.lines.edges
    .map(({ node }) => mapLine(node))
    .filter((l) => l.qty > 0);
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity,
    subtotal: moneyToNumber(c.cost.subtotalAmount),
    total: moneyToNumber(c.cost.totalAmount),
    currency: c.cost.subtotalAmount.currencyCode,
    lines,
  };
}

type CartMutationResp<K extends string> = {
  [P in K]: { cart: ShopifyCart | null; userErrors: { message: string }[] };
};

type CartGetResp = { cart: ShopifyCart | null };

const NO_CACHE = { revalidate: 0, tags: ["shopify:cart"] };

export async function cartCreate(
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart | null> {
  const data = await storefront<CartMutationResp<"cartCreate">>(
    CART_CREATE,
    { lines },
    NO_CACHE,
  );
  const errors = data?.cartCreate.userErrors;
  if (errors && errors.length > 0) {
    console.error(
      "[cart] cartCreate userErrors:",
      errors.map((e) => e.message).join(", "),
    );
  }
  const cart = data?.cartCreate.cart;
  return cart ? mapCart(cart) : null;
}

export async function cartGet(cartId: string): Promise<Cart | null> {
  const data = await storefront<CartGetResp>(
    CART_GET,
    { id: cartId },
    NO_CACHE,
  );
  return data?.cart ? mapCart(data.cart) : null;
}

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[],
): Promise<Cart | null> {
  const data = await storefront<CartMutationResp<"cartLinesAdd">>(
    CART_LINES_ADD,
    { cartId, lines },
    NO_CACHE,
  );
  const errors = data?.cartLinesAdd.userErrors;
  if (errors && errors.length > 0) {
    console.error(
      "[cart] cartLinesAdd userErrors:",
      errors.map((e) => e.message).join(", "),
    );
  }
  const cart = data?.cartLinesAdd.cart;
  return cart ? mapCart(cart) : null;
}

export async function cartLinesUpdate(
  cartId: string,
  lines: { id: string; quantity: number }[],
): Promise<Cart | null> {
  const data = await storefront<CartMutationResp<"cartLinesUpdate">>(
    CART_LINES_UPDATE,
    { cartId, lines },
    NO_CACHE,
  );
  const cart = data?.cartLinesUpdate.cart;
  return cart ? mapCart(cart) : null;
}

export async function cartLinesRemove(
  cartId: string,
  lineIds: string[],
): Promise<Cart | null> {
  const data = await storefront<CartMutationResp<"cartLinesRemove">>(
    CART_LINES_REMOVE,
    { cartId, lineIds },
    NO_CACHE,
  );
  const cart = data?.cartLinesRemove.cart;
  return cart ? mapCart(cart) : null;
}
