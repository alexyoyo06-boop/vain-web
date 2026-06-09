"use server";

// Server actions del carrito. El cliente las invoca desde lib/cart-ui.tsx.
// El cartId vive en localStorage del cliente y se pasa en cada llamada.

import {
  cartCreate,
  cartGet,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
  type Cart,
} from "@/lib/shopify/cart";
import { fetchVariantId } from "@/lib/shopify/products";
import type { ProductSize } from "@/lib/products";

export type AddToCartInput = {
  productHandle: string;
  size: ProductSize;
  quantity?: number;
};

// Las server actions son endpoints públicos: cualquiera puede llamarlas con
// los argumentos que quiera (no solo desde nuestra UI). Acotamos la cantidad
// para que un payload manipulado no meta líneas de 999999 unidades.
const MAX_QTY_PER_LINE = 99;

function clampQty(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QTY_PER_LINE);
}

/** Lee el cart actual (si existe). Devuelve null si el cartId ya no es válido. */
export async function getCartAction(cartId: string | null): Promise<Cart | null> {
  if (!cartId) return null;
  return cartGet(cartId);
}

/** Añade una línea. Crea cart si no había. Devuelve el cart actualizado. */
export async function addToCartAction(
  cartId: string | null,
  { productHandle, size, quantity = 1 }: AddToCartInput,
): Promise<Cart | null> {
  const qty = clampQty(quantity);
  const variantId = await fetchVariantId(productHandle, size);
  if (!variantId) return null;

  if (!cartId) {
    return cartCreate([{ merchandiseId: variantId, quantity: qty }]);
  }

  // Si el cart existe pero ya expiró, Shopify devuelve null → recreamos.
  const updated = await cartLinesAdd(cartId, [
    { merchandiseId: variantId, quantity: qty },
  ]);
  if (updated) return updated;
  return cartCreate([{ merchandiseId: variantId, quantity: qty }]);
}

export async function updateLineAction(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart | null> {
  if (quantity <= 0) {
    return cartLinesRemove(cartId, [lineId]);
  }
  return cartLinesUpdate(cartId, [{ id: lineId, quantity: clampQty(quantity) }]);
}

export async function removeLineAction(
  cartId: string,
  lineId: string,
): Promise<Cart | null> {
  return cartLinesRemove(cartId, [lineId]);
}
