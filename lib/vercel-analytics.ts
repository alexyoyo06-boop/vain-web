import "server-only";

/**
 * Estadísticas de visitantes vía API de Web Analytics de Vercel.
 * https://vercel.com/docs/analytics/web-analytics-api
 *
 * Es LA MISMA data que enseña el dashboard de vercel.com: la pedimos con el
 * token que ya teníamos para Edge Config y la pintamos en /admin, para no
 * tener que entrar a Vercel a mirar cuánta gente pasa por la web.
 *
 * El token es de acceso total a la cuenta: esto es server-only y solo se
 * llama desde /admin, que ya está detrás de la cookie firmada de admin.
 *
 * Límites de la API (comprobados contra la cuenta real, no supuestos):
 *   - El plan Hobby solo da acceso a los últimos 31 días. Pedir 90 días
 *     devuelve 400 — por eso no hay botón de 90 días ni de un año.
 *   - `by=day` no admite rangos de más de 62 días.
 *   - `limit` no puede pasar de 100.
 */

const API = "https://api.vercel.com/v1/query/web-analytics";

// .trim() obligatorio: si el valor se metió en Vercel con `echo |` lleva un
// salto de línea pegado, y la API responde 403 "Not authorized" sin más pista.
const TOKEN = (process.env.VERCEL_API_TOKEN ?? "").trim();
const PROJECT_ID = (process.env.VERCEL_PROJECT_ID ?? "").trim();
const TEAM_ID = (process.env.VERCEL_TEAM_ID ?? "").trim();

/** Sin token o sin project id no hay estadísticas que pedir. */
export const ANALYTICS_READY = Boolean(TOKEN && PROJECT_ID);

/**
 * Periodos del selector. `hours` manda: si lo lleva, la serie va por horas.
 * Tope 31 días por el plan Hobby.
 */
export const PERIODS = [
  { id: "24h", label: "24 h", title: "Últimas 24 horas", hours: 24 },
  { id: "7d", label: "7 días", title: "Últimos 7 días", days: 7 },
  { id: "30d", label: "30 días", title: "Últimos 30 días", days: 30 },
] as const;

export type Period = (typeof PERIODS)[number];
export type PeriodId = Period["id"];

export const DEFAULT_PERIOD: PeriodId = "7d";

export function resolvePeriod(id: string | undefined): Period {
  return PERIODS.find((p) => p.id === id) ?? PERIODS[1];
}

export type Point = {
  /** ISO del inicio del tramo (hora o día). */
  timestamp: string;
  visitors: number;
  pageviews: number;
};
export type Breakdown = { key: string; visitors: number; pageviews: number };

export type VisitorStats = {
  period: Period;
  granularity: "hour" | "day";
  totals: { visitors: number; pageviews: number };
  series: Point[];
  routes: Breakdown[];
  countries: Breakdown[];
  referrers: Breakdown[];
  devices: Breakdown[];
  /** Histórico completo que Vercel conserva, con la fecha desde la que cuenta. */
  allTime: { visitors: number; pageviews: number; since: string } | null;
};

type AggregateRow = Record<string, string | number>;

async function query<T>(
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set("projectId", PROJECT_ID);
  if (TEAM_ID) url.searchParams.set("teamId", TEAM_ID);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    // El panel lo abren dos personas: siempre datos frescos, sin caché.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vercel Analytics ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

/**
 * Un `visits/aggregate` agrupado por una dimensión. El nombre del campo que
 * vuelve en cada fila es el propio `by` (`route`, `country`, …), por eso hay
 * que normalizarlo a `key`.
 */
async function breakdown(
  by: string,
  range: { since: string; until: string },
  limit = 6,
): Promise<Breakdown[]> {
  const json = await query<{ data: AggregateRow[] }>("visits/aggregate", {
    ...range,
    by,
    limit: String(limit),
  });
  return json.data.map((row) => ({
    key: String(row[by] ?? ""),
    visitors: Number(row.visitors ?? 0),
    pageviews: Number(row.pageviews ?? 0),
  }));
}

export async function getVisitorStats(period: Period): Promise<VisitorStats> {
  const granularity: "hour" | "day" = "hours" in period ? "hour" : "day";

  // SIEMPRE timestamps ISO completos, nunca fechas sueltas ("2026-07-27").
  // Con fecha suelta la API "ajusta el rango según la granularidad" y cada
  // consulta acaba mirando un intervalo distinto: la serie por días incluía
  // hoy y el total se paraba en la medianoche de hoy, así que el KPI no
  // cuadraba con la suma de las barras (1224 contra 1431). Con ISO explícito
  // todas las consultas ven exactamente el mismo intervalo.
  const now = Date.now();
  const until = new Date(now).toISOString();
  const range =
    "hours" in period
      ? { since: new Date(now - period.hours * 3_600_000).toISOString(), until }
      : {
          // `days` contando hoy: 7 días = hoy y los 6 anteriores enteros,
          // desde su medianoche.
          since: `${new Date(now - (period.days - 1) * 86_400_000)
            .toISOString()
            .slice(0, 10)}T00:00:00.000Z`,
          until,
        };

  const [serie, total, routes, countries, referrers, devices, allTime] =
    await Promise.all([
      query<{ data: AggregateRow[] }>("visits/aggregate", {
        ...range,
        by: granularity,
        limit: "100",
      }),
      // OJO con el total. NO vale `visits/count`: con rangos de menos de un
      // día redondea al último día completo — para "últimas 24 h" devolvía
      // el día de AYER entero (142 visitantes cuando eran 171) y no cuadraba
      // con el dashboard de Vercel. Tampoco vale sumar los tramos de la
      // serie: quien entra a las 10 y a las 18 contaría dos veces.
      // `aggregate` agrupado por `environment` devuelve UNA fila (el filtro
      // por defecto de la API ya es solo producción) con los visitantes
      // únicos deduplicados del rango exacto. Eso es lo que enseña Vercel.
      query<{ data: AggregateRow[] }>("visits/aggregate", {
        ...range,
        by: "environment",
        limit: "10",
      }),
      breakdown("route", range),
      breakdown("country", range),
      breakdown("referrerHostname", range),
      breakdown("deviceType", range, 4),
      // Histórico completo: sin fechas, la API devuelve el rango disponible
      // entero y nos dice en `query.since` desde cuándo cuenta.
      query<{
        query: { since?: string };
        data: { visitors: number; pageviews: number };
      }>("visits/count", {}).catch(() => null),
    ]);

  return {
    period,
    granularity,
    totals: {
      // En la práctica es una sola fila (producción); se suma por si algún
      // día la API deja de filtrar por entorno.
      visitors: total.data.reduce((sum, r) => sum + Number(r.visitors ?? 0), 0),
      pageviews: total.data.reduce(
        (sum, r) => sum + Number(r.pageviews ?? 0),
        0,
      ),
    },
    series: serie.data.map((row) => ({
      timestamp: String(row.timestamp ?? ""),
      visitors: Number(row.visitors ?? 0),
      pageviews: Number(row.pageviews ?? 0),
    })),
    routes,
    countries,
    referrers,
    devices,
    allTime: allTime
      ? {
          visitors: allTime.data.visitors,
          pageviews: allTime.data.pageviews,
          since: (allTime.query.since ?? "").slice(0, 10),
        }
      : null,
  };
}
