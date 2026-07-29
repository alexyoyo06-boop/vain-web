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
  orders: GlobePoint[];
};

export const EMPTY: GlobeData = { online: 0, visitors: [], orders: [] };

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
      orders.push({ code: o.code, lat: o.lat, lng: o.lng, weight: 1, t: o.t });
    }
  }

  return { online, visitors, orders };
}
