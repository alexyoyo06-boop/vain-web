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
import { getOrderPings, type OrderPing } from "@/lib/orders-geo";

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

// Los pedidos van a un blob y cambian a lo sumo unas decenas de veces al día,
// pero el globo pregunta cada 10 s. Con esta caché en memoria el almacén se
// consulta un tercio de las veces, sin que un pedido tarde en aparecer más de
// lo que uno aguanta mirando el globo (esto es una vista "en vivo").
const ORDERS_TTL_MS = 20_000;
let ordersCache: { at: number; pings: OrderPing[] } | null = null;

async function cachedOrders(): Promise<OrderPing[]> {
  const now = Date.now();
  if (ordersCache && now - ordersCache.at < ORDERS_TTL_MS) {
    return ordersCache.pings;
  }
  const pings = await getOrderPings(30);
  ordersCache = { at: now, pings };
  return pings;
}

export async function GET() {
  if (!(await isAdmin())) return new Response(null, { status: 401 });

  const [presence, orders] = await Promise.all([
    getOnlineSnapshot(),
    cachedOrders(),
  ]);

  return Response.json(
    {
      online: presence.online,
      // ISO-2 → pestañas abiertas ahora mismo desde ese país.
      visitors: presence.countries,
      orders,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
