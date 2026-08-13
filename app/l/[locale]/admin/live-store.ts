"use client";

/**
 * Un único poller de /api/online para todo el panel.
 *
 * Antes cada componente traía el suyo: OnlineNow y AdminGlobe pedían lo mismo
 * cada 10 s por su cuenta, o sea 12 peticiones por minuto con el panel abierto.
 * Y el panel se deja abierto (el globo engancha): 8 horas mirándolo eran ~5.800
 * invocaciones en un día, sin que entrara ni un visitante. Eso se come la cuota
 * de Active CPU del plan gratis (4 h/mes) él solito.
 *
 * Ahora hay un intervalo único, compartido por los dos componentes vía
 * useSyncExternalStore, y a 30 s en vez de 10: de 12 peticiones/min a 2.
 * Sigue siendo una vista "en vivo" — la presencia se mide en ventanas de
 * minutos, no de segundos, así que refrescar más rápido no enseñaba nada nuevo.
 */

import { useSyncExternalStore } from "react";
import { EMPTY, parseGlobeData, type GlobeData } from "./globe-data";
import { DEFAULT_ORDER_RANGE, type OrderRangeId } from "@/lib/order-ranges";

const REFRESH_MS = 30_000;
/** Un pedido es "de hace nada" si entró en los últimos 5 minutos. */
const FRESH_MS = 5 * 60_000;

export type LiveSnapshot = {
  data: GlobeData;
  /** Rango de fechas que corresponde a los pedidos de `data`. */
  range: OrderRangeId;
  /** Se ha pedido otro rango y todavía no ha llegado. */
  loadingRange: boolean;
  /** Pedidos recientes. Se cuenta al recibir los datos y no al pintar: mirar
   *  el reloj durante el render no es puro (y lo canta el linter). */
  fresh: number;
  /** La última petición falló (sesión caducada, red caída). */
  lost: boolean;
  /** Todavía no ha llegado ninguna respuesta: los componentes siguen
   *  enseñando el valor que pintó el servidor. */
  loaded: boolean;
};

const INITIAL: LiveSnapshot = {
  data: EMPTY,
  range: DEFAULT_ORDER_RANGE,
  loadingRange: false,
  fresh: 0,
  lost: false,
  loaded: false,
};

let snapshot: LiveSnapshot = INITIAL;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let inFlight: Promise<void> | null = null;

/** Rango pedido. Puede ir por delante del de `snapshot` mientras carga. */
let wanted: OrderRangeId = DEFAULT_ORDER_RANGE;

function emit(next: LiveSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

async function load(): Promise<void> {
  if (document.visibilityState !== "visible") return;
  // Si ya hay una petición en vuelo (p.ej. el intervalo y un volver-a-la-
  // pestaña a la vez), esperamos a esa en vez de lanzar otra.
  if (inFlight) return inFlight;

  const asked = wanted;

  inFlight = (async () => {
    try {
      const res = await fetch(`/api/online?rango=${asked}`, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = parseGlobeData(await res.json());
      const now = Date.now();
      emit({
        data,
        range: asked,
        // Si mientras cargaba se pidió otro rango, seguimos "cargando": lo que
        // acaba de llegar ya no es lo que el panel está enseñando como elegido.
        loadingRange: wanted !== asked,
        // Cuenta los SITIOS con un pedido reciente, que es lo que late en el
        // globo. Un punto agrupado de una ciudad cuenta como uno.
        fresh: data.orders.filter((o) => now - o.t < FRESH_MS).length,
        lost: false,
        loaded: true,
      });
    } catch {
      // Se congela lo último que se supo y se avisa de que no está fresco.
      emit({ ...snapshot, loadingRange: false, lost: true });
    } finally {
      inFlight = null;
    }
    // El rango cambió a mitad de la petición: hay que ir a por el bueno.
    if (wanted !== asked) void load();
  })();

  return inFlight;
}

/** Cambiar el filtro de fechas: se pide ya, sin esperar al siguiente tick. */
export function setOrderRange(range: OrderRangeId): void {
  if (range === wanted) return;
  wanted = range;
  emit({ ...snapshot, loadingRange: true });
  void load();
}

function onVisibilityChange() {
  // Al volver a la pestaña, refrescar ya: no esperar hasta 30 s.
  if (document.visibilityState === "visible") void load();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // El primero en suscribirse arranca el poller; el último en irse lo para.
  if (listeners.size === 1) {
    void load();
    timer = setInterval(() => void load(), REFRESH_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    if (timer) clearInterval(timer);
    timer = null;
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function getSnapshot(): LiveSnapshot {
  return snapshot;
}

/** En el render del servidor no hay poller: se devuelve el estado vacío para
 *  que cada componente pinte el valor que le llegó por props. */
function getServerSnapshot(): LiveSnapshot {
  return INITIAL;
}

/** Datos en vivo del panel. Todos los que llamen comparten una sola petición. */
export function useLiveData(): LiveSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
