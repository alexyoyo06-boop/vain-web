import "server-only";
import { del, list, put } from "@vercel/blob";
import { countryCentroid, type LatLng } from "@/lib/geo/country-centroids";
import {
  PINGS_PREFIX,
  decodePingPathname,
  encodePingPathname,
  orderCreatedAtMs,
} from "@/lib/orders-pathname";

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

const PREFIX = PINGS_PREFIX;

/**
 * Cuánto se guarda: DIEZ AÑOS, o sea "para siempre" en la práctica.
 *
 * Antes eran 60 días y `purgeOld()` borraba lo anterior en cada pedido nuevo.
 * Eso hacía imposible el histórico que pide el panel: los pedidos de hace tres
 * meses ya no existían en ningún sitio nuestro. El tope se deja solo como
 * válvula de seguridad para que el store no crezca sin fin nunca jamás; cada
 * pedido ocupa lo que ocupa su nombre de fichero (unas decenas de bytes), así
 * que años de pedidos no llegan ni a un megabyte.
 */
const RETENTION_MS = 10 * 365 * 24 * 60 * 60 * 1000;

/**
 * Tope de puntos DISTINTOS que se mandan al navegador.
 *
 * Ya no es un tope de pedidos: los pedidos se agrupan por coordenada antes de
 * salir (ver `aggregate`), así que un punto puede valer por doscientos pedidos
 * de la misma ciudad. Con eso el globo aguanta cualquier histórico sin que la
 * esfera se llene de puntos pisándose ni el WebGL se atragante en un móvil.
 */
const MAX_POINTS = 500;

/** Páginas de `list()`. Cada una trae hasta 1.000 blobs. */
const MAX_PAGES = 50;

/** Sin store de Blob no se guarda nada y el globo enseña solo visitas. */
export const ORDERS_STORE_READY = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export type OrderPing = {
  /** Epoch en ms. En un punto agrupado, el del pedido MÁS RECIENTE del grupo
   *  (así un pedido que acaba de entrar sigue latiendo en el globo). */
  t: number;
  /** ISO-3166 alpha-2. */
  code: string;
  lat: number;
  lng: number;
  /** Cuántos pedidos hay en esta coordenada. 1 si no se agrupó nada. */
  weight: number;
};

/** Lo que necesita el panel para pintar el globo y sus números. */
export type OrderStats = {
  /** Puntos ya agrupados por coordenada, del más viejo al más nuevo. */
  points: OrderPing[];
  /** Pedidos REALES del rango, sin agrupar ni recortar. */
  total: number;
  /** Ranking por país, con todos los pedidos contados. */
  byCountry: { code: string; n: number }[];
  /** Fecha del pedido más antiguo que hay guardado, de todo el store.
   *  Sirve para que el panel avise de desde cuándo hay datos. */
  since: number | null;
};

export type OrderInput = {
  country?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  /** Id del pedido: solo se usa para que un reintento de Shopify no duplique. */
  id: string;
  /** `created_at` de Shopify (ISO-8601). Es la fecha que se guarda. Si falta,
   *  se usa la de ahora. */
  createdAt?: string | null;
};

/** ~11 km. Suficiente para clavar la ciudad en una esfera de 400 px. */
function coarse(n: number): number {
  return Math.round(n * 10) / 10;
}

/** El nombre del fichero ES el registro. Ver lib/orders-pathname.ts. */
function decodePathname(pathname: string, at: Date): OrderPing | null {
  const parts = decodePingPathname(pathname, at);
  return parts ? { ...parts, weight: 1 } : null;
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
    // La fecha del PEDIDO, no la de ahora: es la que hace que el histórico
    // tenga sentido y la que mantiene idempotente el reintento de Shopify
    // (ver lib/orders-pathname.ts).
    t: orderCreatedAtMs(order.createdAt),
    code: resolved.code,
    lat: resolved.point[0],
    lng: resolved.point[1],
    weight: 1,
  };

  try {
    await put(encodePingPathname(ping, order.id), JSON.stringify(ping), {
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
 * TODOS los pedidos guardados, del más viejo al más nuevo.
 *
 * `list()` devuelve como mucho 1.000 blobs por página, así que hay que seguir
 * el cursor: con el histórico entero (y ya no se borra nada) se pasa de 1.000
 * antes o después, y sin paginar se perdería justo lo más antiguo, que es
 * precisamente lo que el panel quiere enseñar.
 */
async function listAllPings(): Promise<OrderPing[]> {
  const all: OrderPing[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await list({ prefix: PREFIX, limit: 1000, cursor });
    for (const b of res.blobs) {
      const ping = decodePathname(b.pathname, b.uploadedAt);
      if (ping) all.push(ping);
    }
    if (!res.hasMore || !res.cursor) break;
    cursor = res.cursor;
  }

  return all.sort((a, b) => a.t - b.t);
}

/**
 * Caché en memoria del barrido completo.
 *
 * El panel puede pedir seis rangos distintos, pero todos salen de la MISMA
 * lista: se barre una vez y se filtra en memoria. Sin esto, cambiar de "30
 * días" a "todo" volvería a recorrer el store entero.
 *
 * Vive en el proceso, así que se pierde en cada arranque en frío. Da igual:
 * es una caché de conveniencia, no un almacén. 20 s es lo que había antes para
 * los pedidos y mantiene la sensación de "en vivo" del globo.
 */
const ALL_TTL_MS = 20_000;
let allCache: { at: number; pings: OrderPing[] } | null = null;

async function cachedAll(): Promise<OrderPing[]> {
  const now = Date.now();
  if (allCache && now - allCache.at < ALL_TTL_MS) return allCache.pings;
  const pings = await listAllPings();
  allCache = { at: now, pings };
  return pings;
}

/**
 * Agrupa por coordenada. Diez pedidos de Madrid son UN punto de peso 10, no
 * diez puntos calcados uno encima de otro. Sin esto, el histórico completo
 * mandaría miles de marcadores al WebGL para dibujar exactamente la misma
 * imagen, y en un móvil eso se nota.
 *
 * La hora del grupo es la del pedido más reciente: así, si acaba de entrar uno,
 * el punto late aunque en esa ciudad haya pedidos de hace meses.
 */
function aggregate(pings: OrderPing[]): OrderPing[] {
  const byCell = new Map<string, OrderPing>();

  for (const p of pings) {
    const key = `${p.code}_${p.lat}_${p.lng}`;
    const prev = byCell.get(key);
    if (prev) {
      prev.weight += p.weight;
      if (p.t > prev.t) prev.t = p.t;
    } else {
      byCell.set(key, { ...p });
    }
  }

  const points = [...byCell.values()];
  if (points.length <= MAX_POINTS) return points.sort((a, b) => a.t - b.t);

  // Si aun agrupando hay demasiados sitios distintos, se quedan los que más
  // pedidos tienen: el mapa sigue contando la misma historia.
  return points
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_POINTS)
    .sort((a, b) => a.t - b.t);
}

/**
 * Los pedidos del rango pedido, listos para el globo.
 *
 * `sinceMs` = epoch desde el que contar. `null` o 0 = todo el histórico.
 *
 * OJO CON "TODO EL HISTÓRICO": es todo lo que hemos visto NOSOTROS. Los pedidos
 * ocurren en Shopify y aquí solo llegan por el webhook `orders/create`, así que
 * el histórico empieza el día que se dio de alta ese webhook — lo anterior vive
 * en Shopify y haría falta su Admin API (con permiso `read_orders`, y
 * `read_all_orders` para pasar de 60 días) para traerlo. `since` devuelve la
 * fecha del pedido más antiguo que sí tenemos, para poder decirlo en el panel.
 */
export async function getOrderStats(sinceMs?: number | null): Promise<OrderStats> {
  if (!ORDERS_STORE_READY) {
    return { points: [], total: 0, byCountry: [], since: null };
  }

  try {
    const all = await cachedAll();
    const since = all.length > 0 ? all[0].t : null;

    const cutoff = sinceMs && sinceMs > 0 ? sinceMs : 0;
    const inRange = cutoff > 0 ? all.filter((p) => p.t >= cutoff) : all;

    const counts = new Map<string, number>();
    for (const p of inRange) {
      counts.set(p.code, (counts.get(p.code) ?? 0) + p.weight);
    }

    return {
      points: aggregate(inRange),
      total: inRange.reduce((n, p) => n + p.weight, 0),
      byCountry: [...counts.entries()]
        .map(([code, n]) => ({ code, n }))
        .sort((a, b) => b.n - a.n),
      since,
    };
  } catch {
    return { points: [], total: 0, byCountry: [], since: null };
  }
}
