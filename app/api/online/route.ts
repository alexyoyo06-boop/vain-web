// Presencia en tiempo real: quién está ahora mismo en la web.
//
//   POST  → latido del navegador (público, lo manda OnlineBeacon).
//   GET   → el número de gente online (solo admin, lo lee el panel).
//
// Ver lib/online-presence.ts para el porqué de llevarlo nosotros en vez de
// pedírselo a la API de Vercel Web Analytics.

import { isAdmin } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getOnlineSnapshot, hashIp, recordPresence } from "@/lib/online-presence";
import { getOrderStats } from "@/lib/orders-geo";
import {
  DEFAULT_ORDER_RANGE,
  isOrderRange,
  orderRangeCutoff,
} from "@/lib/order-ranges";

/** El id lo genera el navegador con crypto.randomUUID() sin guiones. */
const ID_RE = /^[a-f0-9]{32}$/;

/** Código ISO-3166 alpha-2. En local no hay cabecera y se queda sin país. */
const COUNTRY_RE = /^[A-Z]{2}$/;

function country(req: Request): string | undefined {
  const raw = (req.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  return COUNTRY_RE.test(raw) ? raw : undefined;
}

export async function POST(req: Request) {
  const ip = await getClientIp();

  // Cada pestaña late una vez por minuto. 15/min por IP deja sitio de sobra a
  // una casa con varios dispositivos y corta el spam al endpoint.
  if (!checkRateLimit(`online:${ip}`, 15, 60_000).ok) {
    return new Response(null, { status: 429 });
  }

  let id = "";
  try {
    const body: unknown = await req.json();
    if (body && typeof body === "object" && "id" in body) {
      const raw = (body as { id: unknown }).id;
      if (typeof raw === "string") id = raw;
    }
  } catch {
    // cuerpo no-JSON → cae en el 400 de abajo
  }
  if (!ID_RE.test(id)) return new Response(null, { status: 400 });

  await recordPresence(hashIp(ip), id, country(req));
  return new Response(null, { status: 204 });
}

// El rango de fechas llega por query (?rango=hoy|7d|30d|90d|anio|todo). La
// caché de los pedidos vive en lib/orders-geo: allí se barre el store UNA vez
// y se filtra en memoria, así que cambiar de rango en el panel no dispara otro
// barrido.
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response(null, { status: 401 });

  const raw = new URL(req.url).searchParams.get("rango") ?? "";
  const range = isOrderRange(raw) ? raw : DEFAULT_ORDER_RANGE;

  const [presence, stats] = await Promise.all([
    getOnlineSnapshot(),
    getOrderStats(orderRangeCutoff(range)),
  ]);

  return Response.json(
    {
      online: presence.online,
      // ISO-2 → pestañas abiertas ahora mismo desde ese país.
      visitors: presence.countries,
      // Puntos ya agrupados por ciudad; `weight` dice cuántos pedidos hay.
      orders: stats.points,
      range,
      // Pedidos reales del rango, sin agrupar ni recortar.
      ordersTotal: stats.total,
      ordersByCountry: stats.byCountry,
      // Desde cuándo hay datos guardados, para avisar en el panel.
      ordersSince: stats.since,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
