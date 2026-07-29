import "server-only";
import { del, list, put } from "@vercel/blob";
import { countryCentroid, type LatLng } from "@/lib/geo/country-centroids";

/**
 * De dónde vienen los pedidos, para pintarlos en el globo del panel.
 *
 * Los pedidos ocurren en Shopify, no aquí: el checkout se va a su dominio y no
 * vuelve. La única forma de enterarnos es el webhook `orders/create`, que
 * aterriza en /api/orders y llama a `saveOrderPing()`.
 *
 * Dónde se guarda: Vercel Blob. Edge Config queda descartado (tiene tope de
 * tamaño y las escrituras van rate-limited) y la Runtime Cache es efímera —
 * perdería el histórico cada dos por tres.
 *
 * Truco de almacenamiento: **un blob por pedido, con los datos en el propio
 * nombre**. Dos motivos:
 *   1. Cero carreras. Un solo fichero compartido obligaría a leer-modificar-
 *      escribir, y en la primera hora de un drop entran ~10 pedidos: dos
 *      simultáneos se pisarían.
 *   2. El panel resuelve el globo con UN `list()`, sin descargar N ficheros.
 *
 * Qué se guarda: cuándo, país y una coordenada redondeada a 1 decimal (~11 km,
 * la ciudad sí, la casa no). Ni nombre, ni email, ni dirección, ni importe.
 */

const PREFIX = "pings/";
const RETENTION_MS = 60 * 24 * 60 * 60 * 1000; // 60 días
/** Tope de puntos que se mandan al navegador. Más sería ruido en la esfera. */
const MAX_PINGS = 300;

/** Sin store de Blob no se guarda nada y el globo enseña solo visitas. */
export const ORDERS_STORE_READY = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export type OrderPing = {
  /** Epoch en ms. */
  t: number;
  /** ISO-3166 alpha-2. */
  code: string;
  lat: number;
  lng: number;
};

export type OrderInput = {
  country?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Id del pedido: solo se usa para que un reintento de Shopify no duplique. */
  id: string;
};

/** ~11 km. Suficiente para clavar la ciudad en una esfera de 400 px. */
function coarse(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * El nombre del blob es el registro: `pings/{idPedido}_{ISO2}_{lat}_{lng}.json`
 *
 * El id del pedido va primero y la hora NO va en el nombre: así el reintento
 * del mismo pedido escribe exactamente la misma ruta y se pisa a sí mismo en
 * vez de dibujar un segundo punto. La hora la da `uploadedAt` del `list()`.
 */
function encodePathname(ping: OrderPing, id: string): string {
  const safeId = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || "x";
  return `${PREFIX}${safeId}_${ping.code}_${ping.lat}_${ping.lng}.json`;
}

function decodePathname(pathname: string, at: Date): OrderPing | null {
  const name = pathname.slice(PREFIX.length).replace(/\.json$/, "");
  const parts = name.split("_");
  if (parts.length < 4) return null;

  const code = parts[1];
  const lat = Number(parts[2]);
  const lng = Number(parts[3]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!/^[A-Z]{2}$/.test(code)) return null;

  return { t: at.getTime(), code, lat, lng };
}

/**
 * Coordenada del pedido. Shopify manda `latitude`/`longitude` en la dirección
 * de envío, pero desde hace unas cuantas versiones de la API suelen venir a
 * `null`: por eso el respaldo al centroide del país.
 */
function resolvePoint(order: OrderInput): { code: string; point: LatLng } | null {
  const code = (order.country ?? "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;

  const { lat, lng } = order;
  if (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  ) {
    return { code, point: [coarse(lat), coarse(lng)] };
  }

  const centroid = countryCentroid(code);
  return centroid ? { code, point: centroid } : null;
}

/**
 * Apunta un pedido. Devuelve `false` si no había nada que apuntar (país
 * desconocido) o si no hay store: en ningún caso lanza, porque el que llama es
 * un webhook y a Shopify hay que contestarle 200 o se pone a reintentar.
 */
export async function saveOrderPing(order: OrderInput): Promise<boolean> {
  if (!ORDERS_STORE_READY) return false;

  const resolved = resolvePoint(order);
  if (!resolved) return false;

  const ping: OrderPing = {
    t: Date.now(),
    code: resolved.code,
    lat: resolved.point[0],
    lng: resolved.point[1],
  };

  try {
    await put(encodePathname(ping, order.id), JSON.stringify(ping), {
      // Store privado: aunque aquí solo hay país y una coordenada redondeada,
      // no hay motivo para que sea legible desde fuera con la URL.
      access: "private",
      contentType: "application/json",
      // Sin sufijo aleatorio + sobrescritura = un reintento del mismo pedido
      // pisa su propia entrada en vez de dibujar dos puntos.
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } catch {
    // Un punto de menos en el globo no justifica devolverle un error a Shopify.
    return false;
  }

  void purgeOld();
  return true;
}

/** Barrido oportunista al escribir: sale más barato que un cron. */
async function purgeOld(): Promise<void> {
  try {
    const cutoff = Date.now() - RETENTION_MS;
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
    const stale = blobs
      .filter((b) => b.uploadedAt.getTime() < cutoff)
      .map((b) => b.url);
    if (stale.length > 0) await del(stale);
  } catch {
    // Si falla, se reintenta en el siguiente pedido.
  }
}

/**
 * Los pedidos de los últimos `days` días, del más viejo al más nuevo.
 * Un solo `list()`: los datos van en el nombre del blob, no en su contenido.
 */
export async function getOrderPings(days = 30): Promise<OrderPing[]> {
  if (!ORDERS_STORE_READY) return [];

  try {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const { blobs } = await list({ prefix: PREFIX, limit: 1000 });

    return blobs
      .map((b) => decodePathname(b.pathname, b.uploadedAt))
      .filter((p): p is OrderPing => p !== null && p.t >= cutoff)
      .sort((a, b) => a.t - b.t)
      .slice(-MAX_PINGS);
  } catch {
    return [];
  }
}
