"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import GlobeErrorBoundary from "./GlobeErrorBoundary";
import { EMPTY, parseGlobeData, type GlobeData, type GlobePoint } from "./globe-data";

/**
 * De dónde vienen los pedidos, sobre un globo que gira — la idea es la misma
 * que el Live View de Shopify, que no se puede embeber por ser UI interna de su
 * admin.
 *
 * Dos capas:
 *   · gente con la web abierta ahora mismo (punto de tinta), del mismo latido
 *     que alimenta el contador "N online" de la cabecera;
 *   · pedidos de los últimos 30 días (verde), que llegan por el webhook
 *     `orders/create` de Shopify. Los de hace menos de 5 minutos laten y
 *     dibujan un arco desde España.
 *
 * El canvas se carga solo en el navegador: WebGL no existe en el servidor.
 */

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => <div className="w-full aspect-square" />,
});

const REFRESH_MS = 10_000;
const FRESH_MS = 5 * 60_000;
const NUM = new Intl.NumberFormat("es-ES");
const REGION = new Intl.DisplayNames(["es"], { type: "region" });

function countryName(code: string): string {
  try {
    return REGION.of(code) ?? code;
  } catch {
    // Códigos que no son región (XK y compañía) revientan el DisplayNames.
    return code;
  }
}

/** Ranking de países por pedidos, que es la pregunta de verdad. */
function rankOrders(orders: GlobePoint[]): { code: string; n: number }[] {
  const byCode = new Map<string, number>();
  for (const o of orders) byCode.set(o.code, (byCode.get(o.code) ?? 0) + 1);
  return [...byCode.entries()]
    .map(([code, n]) => ({ code, n }))
    .sort((a, b) => b.n - a.n);
}

export default function AdminGlobe({ initialOnline }: { initialOnline: number }) {
  const [data, setData] = useState<GlobeData>({ ...EMPTY, online: initialOnline });
  const [lost, setLost] = useState(false);
  // Cuántos pedidos son de hace nada. Se calcula al recibir los datos y no al
  // pintar: mirar el reloj durante el render no es puro (y lo canta el linter).
  const [fresh, setFresh] = useState(0);

  const load = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/online", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const parsed = parseGlobeData(await res.json());
      const now = Date.now();
      setData(parsed);
      setFresh(parsed.orders.filter((o) => now - o.t < FRESH_MS).length);
      setLost(false);
    } catch {
      // Sesión caducada o red caída: se congela lo último que se supo.
      setLost(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [load]);

  const ranking = useMemo(() => rankOrders(data.orders), [data.orders]);

  // Lo que se ve si WebGL no va: la misma información, en lista.
  const fallback = (
    <div className="py-6">
      {ranking.length === 0 ? (
        <p className="text-sm text-ink-soft">Todavía no hay pedidos que pintar.</p>
      ) : (
        <ul className="space-y-1.5">
          {ranking.slice(0, 8).map((row) => (
            <li
              key={row.code}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="truncate">{countryName(row.code)}</span>
              <span className="tabular-nums shrink-0">{NUM.format(row.n)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <section className="rounded-3xl bg-bone-dim/60 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <p className="text-xs uppercase tracking-widest text-ink-soft inline-flex items-center gap-2">
          <Globe2 className="size-3.5" strokeWidth={2.25} />
          En vivo
        </p>
        {lost && (
          <p className="text-xs text-ink-soft/70">Sin actualizar</p>
        )}
      </div>

      <h2
        className="font-display uppercase tracking-tighter leading-none mb-4"
        style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
      >
        De dónde vienen
      </h2>

      {/* Tan grande como quepa: el ancho manda en el móvil y la altura en el
          ordenador, para que la esfera entera se vea sin tener que hacer
          scroll y quede sitio para la leyenda de abajo. */}
      <div className="mx-auto w-full max-w-[min(88vw,68vh)]">
        <GlobeErrorBoundary fallback={fallback}>
          <GlobeCanvas visitors={data.visitors} orders={data.orders} />
        </GlobeErrorBoundary>
      </div>

      {/* Leyenda y números. El "N online" repite el de la cabecera a propósito:
          aquí es lo que explica los puntos oscuros del globo. */}
      <dl className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-sm">
        <div className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-ink" aria-hidden />
          <dt className="text-ink-soft">Ahora en la web</dt>
          <dd className="tabular-nums font-semibold">{NUM.format(data.online)}</dd>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-online" aria-hidden />
          <dt className="text-ink-soft">Pedidos (30 d)</dt>
          <dd className="tabular-nums font-semibold">
            {NUM.format(data.orders.length)}
          </dd>
        </div>
      </dl>

      {fresh > 0 && (
        <p className="text-center text-xs text-ink-soft mt-2">
          {fresh === 1
            ? "1 pedido en los últimos 5 minutos."
            : `${NUM.format(fresh)} pedidos en los últimos 5 minutos.`}
        </p>
      )}

      {ranking.length > 0 && (
        <p className="text-center text-xs text-ink-soft mt-2">
          {ranking
            .slice(0, 4)
            .map((r) => `${countryName(r.code)} ${NUM.format(r.n)}`)
            .join(" · ")}
        </p>
      )}

      <p className="text-center text-xs text-ink-soft/60 mt-3">
        Arrastra para girar · pellizca o rueda para acercar · doble toque para
        volver
      </p>

      {data.orders.length === 0 && (
        <p className="text-center text-xs text-ink-soft/70 mt-3">
          Sin pedidos en los últimos 30 días. Los nuevos salen aquí solos.
        </p>
      )}
    </section>
  );
}
