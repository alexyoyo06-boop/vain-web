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
import { ShopifyUnavailableError } from "@/lib/shopify/client";
import type { ProductSize } from "@/lib/products";

/**
 * Aquí hay una persona esperando con el dedo en el botón, así que un fallo de
 * Shopify NO puede convertirse en una pantalla de error: se devuelve `null`,
 * que es lo que estas acciones ya usan para decir "no ha podido ser" y la UI
 * traduce en un aviso.
 *
 * Es lo contrario de lo que interesa al pintar páginas: allí el error SÍ tiene
 * que propagarse, para que Next no cachee una tienda vacía (ver el porqué largo
 * en ShopifyUnavailableError).
 */
async function sinRomper<T>(fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ShopifyUnavailableError) {
      console.error("[carrito] Shopify no responde:", err.message);
      return null;
    }
    throw err;
  }
}

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
  return sinRomper(() => cartGet(cartId));
}

/** Añade una línea. Crea cart si no había. Devuelve el cart actualizado. */
export async function addToCartAction(
  cartId: string | null,
  { productHandle, size, quantity = 1 }: AddToCartInput,
): Promise<Cart | null> {
  const qty = clampQty(quantity);
  return sinRomper(async () => {
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
  });
}

export async function updateLineAction(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart | null> {
  if (quantity <= 0) {
    return sinRomper(() => cartLinesRemove(cartId, [lineId]));
  }
  return sinRomper(() =>
    cartLinesUpdate(cartId, [{ id: lineId, quantity: clampQty(quantity) }]),
  );
}

export async function removeLineAction(
  cartId: string,
  lineId: string,
): Promise<Cart | null> {
  return sinRomper(() => cartLinesRemove(cartId, [lineId]));
}
