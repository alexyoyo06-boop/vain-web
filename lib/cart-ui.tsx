"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  addToCartAction,
  getCartAction,
  removeLineAction,
  updateLineAction,
} from "@/lib/cart-actions";
import { productHref } from "@/lib/products";

export type CartItem = {
  /** Shopify cart line ID. Único, usado en updateQty/removeItem. */
  lineId: string;
  variantId: string;
  productHandle: string;
  name: string;
  size: string;
  price: number;
  image: string;
  qty: number;
  href: string;
};

export type ToastItem = {
  id: string;
  name: string;
  size: string;
  image: string;
  // marca de tiempo para rerenderizar el toast aunque añadas el mismo item dos veces
  key: number;
};

export type AddItemInput = {
  productHandle: string;
  size: string;
  // metadata UI para el toast (no llega a Shopify):
  name: string;
  image: string;
  href: string;
  price: number;
};

type CartUI = {
  items: CartItem[];
  count: number;
  subtotal: number;
  checkoutUrl: string | null;
  toast: ToastItem | null;
  /** Hay una operación de carrito en vuelo (server action). */
  isPending: boolean;
  addItem: (item: AddItemInput, qty?: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  updateQty: (lineId: string, delta: number) => Promise<void>;
  dismissToast: () => void;
};

const CartUIContext = createContext<CartUI | null>(null);

const CART_ID_KEY = "vain:cartId";
const TOAST_DURATION_MS = 3500;

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const cartIdRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // --- Toast ---

  const showToast = useCallback((item: ToastItem) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(item);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // --- Hidratar items desde Shopify si hay cartId persistido ---

  const applyCart = useCallback(
    (cart: Awaited<ReturnType<typeof getCartAction>>) => {
      if (!cart) {
        cartIdRef.current = null;
        localStorage.removeItem(CART_ID_KEY);
        setItems([]);
        setCheckoutUrl(null);
        return;
      }
      cartIdRef.current = cart.id;
      try {
        localStorage.setItem(CART_ID_KEY, cart.id);
      } catch {
        // localStorage puede fallar en modo privado de algún navegador.
      }
      setCheckoutUrl(cart.checkoutUrl);
      setItems(
        cart.lines.map((l) => ({
          lineId: l.lineId,
          variantId: l.variantId,
          productHandle: l.productHandle,
          name: l.productTitle,
          size: l.size,
          price: l.price,
          image: l.image,
          qty: l.qty,
          href: productHref({ category: l.category, slug: l.productHandle }),
        })),
      );
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    try {
      const stored = localStorage.getItem(CART_ID_KEY);
      cartIdRef.current = stored;
      if (stored) {
        getCartAction(stored).then((cart) => {
          if (!cancelled) applyCart(cart);
        });
      }
    } catch {
      // ignore
    }
    return () => {
      cancelled = true;
    };
  }, [applyCart]);

  // --- Mutations ---

  const addItem = useCallback<CartUI["addItem"]>(
    async (input, qty = 1) => {
      // Toast optimista — la respuesta del server pinta el item real.
      showToast({
        id: `${input.productHandle}-${input.size.toLowerCase()}`,
        name: input.name,
        size: input.size,
        image: input.image,
        key: Date.now(),
      });
      startTransition(async () => {
        const cart = await addToCartAction(cartIdRef.current, {
          productHandle: input.productHandle,
          size: input.size as never,
          quantity: qty,
        });
        applyCart(cart);
      });
    },
    [showToast, applyCart],
  );

  const removeItem = useCallback<CartUI["removeItem"]>(
    async (lineId) => {
      const cartId = cartIdRef.current;
      if (!cartId) return;
      // Optimista
      setItems((arr) => arr.filter((it) => it.lineId !== lineId));
      startTransition(async () => {
        const cart = await removeLineAction(cartId, lineId);
        applyCart(cart);
      });
    },
    [applyCart],
  );

  const updateQty = useCallback<CartUI["updateQty"]>(
    async (lineId, delta) => {
      const cartId = cartIdRef.current;
      if (!cartId) return;
      const current = items.find((it) => it.lineId === lineId);
      if (!current) return;
      const next = Math.max(0, current.qty + delta);
      // Optimista
      setItems((arr) =>
        arr
          .map((it) => (it.lineId === lineId ? { ...it, qty: next } : it))
          .filter((it) => it.qty > 0),
      );
      startTransition(async () => {
        const cart = await updateLineAction(cartId, lineId, next);
        applyCart(cart);
      });
    },
    [items, applyCart],
  );

  const value = useMemo<CartUI>(
    () => ({
      items,
      count: items.reduce((s, it) => s + it.qty, 0),
      subtotal: items.reduce((s, it) => s + it.price * it.qty, 0),
      checkoutUrl,
      toast,
      isPending,
      addItem,
      removeItem,
      updateQty,
      dismissToast,
    }),
    [items, checkoutUrl, toast, isPending, addItem, removeItem, updateQty, dismissToast],
  );

  return (
    <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>
  );
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI must be used within CartUIProvider");
  return ctx;
}
