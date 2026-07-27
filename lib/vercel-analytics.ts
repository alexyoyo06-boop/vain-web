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

/** Sin token o sin project id no hay estadísticas que pedir. */
export const ANALYTICS_READY = Boolean(
  process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID,
);

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
  url.searchParams.set("projectId", process.env.VERCEL_PROJECT_ID ?? "");
  const teamId = process.env.VERCEL_TEAM_ID;
  if (teamId) url.searchParams.set("teamId", teamId);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
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

  // Con horas hace falta rango con hora (ISO completo); con días basta la
  // fecha, y así el primer y el último día salen enteros.
  const now = Date.now();
  const range =
    "hours" in period
      ? {
          since: new Date(now - period.hours * 3_600_000).toISOString(),
          until: new Date(now).toISOString(),
        }
      : {
          // `days` contando hoy: 7 días = hoy y los 6 anteriores.
          since: new Date(now - (period.days - 1) * 86_400_000)
            .toISOString()
            .slice(0, 10),
          until: new Date(now).toISOString().slice(0, 10),
        };

  const [serie, total, routes, countries, referrers, devices, allTime] =
    await Promise.all([
      query<{ data: AggregateRow[] }>("visits/aggregate", {
        ...range,
        by: granularity,
        limit: "100",
      }),
      // El total lo da `count`, no la suma de los tramos: es el endpoint
      // autoritativo para "cuánta gente distinta pasó en el periodo".
      query<{ data: { visitors: number; pageviews: number } }>(
        "visits/count",
        range,
      ),
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
      visitors: total.data.visitors,
      pageviews: total.data.pageviews,
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
