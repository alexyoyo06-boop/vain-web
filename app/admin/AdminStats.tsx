import Link from "next/link";
import { BarChart3, AlertTriangle } from "lucide-react";
import {
  ANALYTICS_READY,
  PERIODS,
  getVisitorStats,
  type Breakdown,
  type Period,
  type VisitorStats,
} from "@/lib/vercel-analytics";

/**
 * Etiqueta del eje. Por horas basta "18h"; por días, "26/7". La serie viene
 * en UTC y la web vende en España, así que se pinta en hora de Madrid.
 */
function formatPoint(iso: string, granularity: "hour" | "day"): string {
  if (!iso) return "";
  const date = new Date(iso);
  return granularity === "hour"
    ? `${new Intl.DateTimeFormat("es-ES", { hour: "numeric", timeZone: "Europe/Madrid" }).format(date)}h`
    : new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "numeric",
        timeZone: "Europe/Madrid",
      }).format(date);
}

// Estadísticas de visitantes (Vercel Web Analytics) dentro del panel.
// Server Component a propósito: el token de Vercel se queda en el servidor y
// al navegador solo llegan los números ya calculados.

const NUM = new Intl.NumberFormat("es-ES");

/** Rutas de Next en cristiano. La ruta cruda queda debajo como pista. */
const ROUTE_LABEL: Record<string, string> = {
  "/": "Portada",
  "/[category]/[slug]": "Fichas de producto",
  "/c/[slug]": "Colecciones",
  "/todo": "Toda la ropa",
  "/cart": "Carrito",
  "/nuevo-drop": "Nuevo drop",
  "/archivo": "Archivo",
  "/coming-soon": "Muro de acceso",
  "/admin": "Panel admin",
  Others: "Otras",
};

const COUNTRY_LABEL: Record<string, string> = {
  ES: "España",
  FR: "Francia",
  US: "Estados Unidos",
  DE: "Alemania",
  GB: "Reino Unido",
  IT: "Italia",
  NL: "Países Bajos",
  PT: "Portugal",
  BE: "Bélgica",
  IE: "Irlanda",
  MX: "México",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  MA: "Marruecos",
  PL: "Polonia",
  CH: "Suiza",
  AT: "Austria",
  SE: "Suecia",
  Others: "Otros",
};

/** De dónde llega la gente. Los `com.google.*` son apps de Android. */
const REFERRER_LABEL: Record<string, string> = {
  "": "Directo (o desde una app)",
  "l.instagram.com": "Instagram",
  "instagram.com": "Instagram",
  "www.instagram.com": "Instagram",
  "tiktok.com": "TikTok",
  "vm.tiktok.com": "TikTok",
  "www.tiktok.com": "TikTok",
  "google.com": "Google",
  "www.google.com": "Google",
  "com.google.android.googlequicksearchbox": "Google (app Android)",
  "com.google.android.gm": "Gmail (Android)",
  "t.co": "X (Twitter)",
  "vainspn.myshopify.com": "Shopify (checkout)",
  "v4in.com": "La propia web",
  "www.v4in.com": "La propia web",
  Others: "Otros",
};

const DEVICE_LABEL: Record<string, string> = {
  mobile: "Móvil",
  desktop: "Ordenador",
  tablet: "Tablet",
  Others: "Otros",
};

function label(map: Record<string, string>, key: string): string {
  return map[key] ?? (key === "" ? "Desconocido" : key);
}

/** Tarjeta de número grande. Sin gráfico: el dato ya es la respuesta. */
function Kpi({ value, caption }: { value: number; caption: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-bone p-5">
      <p
        className="font-display uppercase tracking-tighter leading-none"
        style={{ fontSize: "clamp(1.75rem, 8vw, 2.75rem)" }}
      >
        {NUM.format(value)}
      </p>
      <p className="text-xs uppercase tracking-widest text-ink-soft mt-2">
        {caption}
      </p>
    </div>
  );
}

/**
 * Visitantes por día. Una sola serie, así que un solo tono de tinta y sin
 * leyenda: el título ya dice qué se está mirando. Solo se etiqueta el día
 * más alto — un número encima de cada barra sería ruido.
 */
/** ¿El primer y el último tramo de la serie caen en el mismo día natural? */
function mismoDia(data: VisitorStats["series"]): boolean {
  const dia = (iso: string) =>
    new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      timeZone: "Europe/Madrid",
    }).format(new Date(iso));
  return dia(data[0].timestamp) === dia(data[data.length - 1].timestamp);
}

function TrendBars({
  data,
  granularity,
}: {
  data: VisitorStats["series"];
  granularity: "hour" | "day";
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-soft mt-5">Sin visitas en este periodo.</p>
    );
  }

  const max = Math.max(1, ...data.map((d) => d.visitors));
  const peak = data.reduce((a, b) => (b.visitors > a.visitors ? b : a), data[0]);
  const unidad = granularity === "hour" ? "hora" : "día";

  return (
    <figure className="mt-5">
      <div
        className="flex items-end gap-[2px] h-32"
        role="img"
        aria-label={`Visitantes por ${unidad}. Máximo: ${NUM.format(peak.visitors)} (${formatPoint(peak.timestamp, granularity)}).`}
      >
        {data.map((d) => (
          <div
            key={d.timestamp}
            className="flex-1 min-w-0 rounded-t bg-ink/85"
            style={{ height: `${Math.max(2, (d.visitors / max) * 100)}%` }}
            title={`${formatPoint(d.timestamp, granularity)}: ${NUM.format(d.visitors)} visitantes · ${NUM.format(d.pageviews)} páginas`}
          />
        ))}
      </div>
      <figcaption className="flex justify-between gap-2 text-xs text-ink-soft mt-2">
        <span>
          {/* En 24 h las dos puntas caen a la misma hora ("14h … 14h"): sin
              el "ayer" no se sabe cuál es cuál. */}
          {granularity === "hour" && !mismoDia(data) && "ayer "}
          {formatPoint(data[0].timestamp, granularity)}
        </span>
        <span className="truncate">
          Máx. {NUM.format(peak.visitors)} ·{" "}
          {formatPoint(peak.timestamp, granularity)}
        </span>
        <span>{formatPoint(data[data.length - 1].timestamp, granularity)}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Varias claves pueden ser la misma cosa para quien mira: `l.instagram.com` y
 * `www.instagram.com` son Instagram. Si no se suman, Instagram sale dos veces
 * en la lista y parece que rinde la mitad.
 */
function mergeByLabel(
  rows: Breakdown[],
  map: Record<string, string>,
): { label: string; raw: string | null; visitors: number }[] {
  const merged = new Map<string, { raw: string | null; visitors: number }>();

  for (const row of rows) {
    const name = label(map, row.key);
    const previous = merged.get(name);
    if (previous) {
      previous.visitors += row.visitors;
      // Dos claves distintas bajo el mismo nombre: la cruda ya no identifica
      // la fila, así que se cae.
      previous.raw = null;
    } else {
      merged.set(name, { raw: row.key || null, visitors: row.visitors });
    }
  }

  return [...merged.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.visitors - a.visitors);
}

/**
 * Ranking con barra de fondo. La barra es magnitud relativa al primero, no
 * un porcentaje del total: es lo que se lee de un vistazo en una lista corta.
 */
function Ranking({
  title,
  rows: rawRows,
  map,
  showRaw = false,
}: {
  title: string;
  rows: Breakdown[];
  map: Record<string, string>;
  showRaw?: boolean;
}) {
  const rows = mergeByLabel(rawRows, map);
  const max = Math.max(1, ...rows.map((r) => r.visitors));

  return (
    <section className="rounded-2xl bg-bone p-5">
      <p className="text-xs uppercase tracking-widest text-ink-soft mb-4">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">Sin datos en este periodo.</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((row) => (
            <li key={row.label} className="relative">
              <div
                className="absolute inset-y-0 left-0 rounded-lg bg-ink/[0.07]"
                style={{ width: `${(row.visitors / max) * 100}%` }}
                aria-hidden
              />
              <div className="relative flex items-baseline justify-between gap-3 px-2.5 py-1.5">
                <span className="text-sm truncate">
                  {row.label}
                  {/* La ruta cruda solo aporta cuando es una ruta de verdad:
                      al lado de "Otras" sería ruido. */}
                  {showRaw && row.raw && row.raw !== "Others" && (
                    <span className="text-ink-soft/70 ml-1.5 text-xs">
                      {row.raw}
                    </span>
                  )}
                </span>
                <span className="text-sm tabular-nums shrink-0">
                  {NUM.format(row.visitors)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminStats({ period }: { period: Period }) {
  if (!ANALYTICS_READY) {
    return (
      <section className="rounded-3xl border border-blood/30 bg-blood/5 p-5 text-sm flex gap-3">
        <AlertTriangle
          className="size-5 shrink-0 mt-0.5 text-blood"
          strokeWidth={2.25}
        />
        <div>
          <p className="font-semibold mb-1">Sin estadísticas.</p>
          <p className="text-ink-soft">
            Faltan <code className="font-mono">VERCEL_API_TOKEN</code> o{" "}
            <code className="font-mono">VERCEL_PROJECT_ID</code> en el entorno.
          </p>
        </div>
      </section>
    );
  }

  let stats: VisitorStats;
  try {
    stats = await getVisitorStats(period);
  } catch (error) {
    // La API de Vercel puede caerse o cambiar: que no se lleve por delante el
    // resto del panel, que es lo que de verdad hace falta para abrir/cerrar.
    return (
      <section className="rounded-3xl border border-blood/30 bg-blood/5 p-5 text-sm flex gap-3">
        <AlertTriangle
          className="size-5 shrink-0 mt-0.5 text-blood"
          strokeWidth={2.25}
        />
        <div>
          <p className="font-semibold mb-1">No se han podido leer las visitas.</p>
          <p className="text-ink-soft">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <p className="text-xs uppercase tracking-widest text-ink-soft inline-flex items-center gap-2">
          <BarChart3 className="size-3.5" strokeWidth={2.25} />
          Visitas
        </p>
        <nav className="flex gap-1 rounded-full bg-bone p-1" aria-label="Periodo">
          {PERIODS.map((p) => (
            <Link
              key={p.id}
              href={`/admin?periodo=${p.id}`}
              scroll={false}
              aria-current={p.id === period.id ? "page" : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-colors ${
                p.id === period.id
                  ? "bg-ink text-bone"
                  : "text-ink-soft hover:bg-ink/5"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      <h2
        className="font-display uppercase tracking-tighter leading-none mb-5"
        style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
      >
        {period.title}
      </h2>

      <div className="flex gap-3">
        <Kpi value={stats.totals.visitors} caption="Visitantes" />
        <Kpi value={stats.totals.pageviews} caption="Páginas vistas" />
      </div>

      <TrendBars data={stats.series} granularity={stats.granularity} />

      <div className="grid gap-3 sm:grid-cols-2 mt-6">
        <Ranking title="Páginas" rows={stats.routes} map={ROUTE_LABEL} showRaw />
        <Ranking title="Países" rows={stats.countries} map={COUNTRY_LABEL} />
        <Ranking
          title="De dónde vienen"
          rows={stats.referrers}
          map={REFERRER_LABEL}
        />
        <Ranking title="Dispositivo" rows={stats.devices} map={DEVICE_LABEL} />
      </div>

      {stats.allTime && (
        <p className="text-xs text-ink-soft mt-5">
          Histórico que guarda Vercel (desde el{" "}
          {formatPoint(stats.allTime.since, "day")}):{" "}
          {NUM.format(stats.allTime.visitors)} visitantes y{" "}
          {NUM.format(stats.allTime.pageviews)} páginas vistas. El plan Hobby
          solo deja consultar los últimos 31 días.
        </p>
      )}
    </section>
  );
}
