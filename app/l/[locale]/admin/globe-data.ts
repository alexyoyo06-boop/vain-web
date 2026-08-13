// Lo que /api/online le manda al globo, ya masticado.
//
// Ni el desglose de visitas (ISO-2 → cuántos) ni los pedidos vienen con
// coordenadas: las pone `countryCentroid` a partir del código de país. Esto va
// en un módulo aparte para que el componente de WebGL solo importe tipos y
// pueda quedarse detrás de un error boundary.

import { countryCentroid } from "@/lib/geo/country-centroids";

export type GlobePoint = {
  code: string;
  lat: number;
  lng: number;
  /** Visitas: cuánta gente. Pedidos: siempre 1. */
  weight: number;
  /** Cuándo entró el pedido (epoch ms). 0 en las visitas. */
  t: number;
};

export type GlobeData = {
  online: number;
  visitors: GlobePoint[];
  /** Puntos de pedidos YA AGRUPADOS por ciudad: `weight` es cuántos hay. */
  orders: GlobePoint[];
  /** Pedidos reales del rango. No es `orders.length`: eso son sitios, no
   *  pedidos, y además viene recortado si hay demasiados puntos distintos. */
  ordersTotal: number;
  /** Ranking por país con todos los pedidos contados, no solo los pintados. */
  ordersByCountry: { code: string; n: number }[];
  /** Epoch del pedido más antiguo guardado, o null si no hay ninguno. */
  ordersSince: number | null;
};

export const EMPTY: GlobeData = {
  online: 0,
  visitors: [],
  orders: [],
  ordersTotal: 0,
  ordersByCountry: [],
  ordersSince: null,
};

/**
 * La respuesta de la API es JSON sin tipar: se valida campo a campo. Cualquier
 * cosa rara se descarta en silencio — el globo con un punto de menos es mejor
 * que un panel roto.
 */
export function parseGlobeData(raw: unknown): GlobeData {
  if (!raw || typeof raw !== "object") return EMPTY;
  const body = raw as Record<string, unknown>;

  const online = typeof body.online === "number" ? body.online : 0;

  const visitors: GlobePoint[] = [];
  if (body.visitors && typeof body.visitors === "object") {
    for (const [code, n] of Object.entries(
      body.visitors as Record<string, unknown>,
    )) {
      const point = countryCentroid(code);
      if (!point || typeof n !== "number" || n <= 0) continue;
      visitors.push({ code, lat: point[0], lng: point[1], weight: n, t: 0 });
    }
  }

  const orders: GlobePoint[] = [];
  if (Array.isArray(body.orders)) {
    for (const item of body.orders) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (
        typeof o.lat !== "number" ||
        typeof o.lng !== "number" ||
        typeof o.t !== "number" ||
        typeof o.code !== "string"
      ) {
        continue;
      }
      // `weight` es nuevo: un punto puede valer por varios pedidos de la misma
      // ciudad. Si no viene (respuesta de una versión anterior servida desde
      // una pestaña vieja), vale 1 y el globo se ve igual que antes.
      const weight =
        typeof o.weight === "number" && o.weight >= 1 ? Math.floor(o.weight) : 1;
      orders.push({ code: o.code, lat: o.lat, lng: o.lng, weight, t: o.t });
    }
  }

  const ordersByCountry: { code: string; n: number }[] = [];
  if (Array.isArray(body.ordersByCountry)) {
    for (const item of body.ordersByCountry) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      if (typeof r.code !== "string" || typeof r.n !== "number") continue;
      ordersByCountry.push({ code: r.code, n: r.n });
    }
  }

  const ordersTotal =
    typeof body.ordersTotal === "number"
      ? body.ordersTotal
      : // Respaldo para respuestas sin el campo: sumar los pesos pintados.
        orders.reduce((n, o) => n + o.weight, 0);

  const ordersSince =
    typeof body.ordersSince === "number" ? body.ordersSince : null;

  return { online, visitors, orders, ordersTotal, ordersByCountry, ordersSince };
}
