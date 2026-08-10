"use client";

import dynamic from "next/dynamic";
import { Globe2 } from "lucide-react";
import GlobeErrorBoundary from "./GlobeErrorBoundary";
import { setOrderRange, useLiveData } from "./live-store";
import { ORDER_RANGES, orderRangeLabel } from "@/lib/order-ranges";

/**
 * De dónde vienen los pedidos, sobre un globo que gira — la idea es la misma
 * que el Live View de Shopify, que no se puede embeber por ser UI interna de su
 * admin.
 *
 * Dos capas:
 *   · gente con la web abierta ahora mismo (punto de tinta), del mismo latido
 *     que alimenta el contador "N online" de la cabecera;
 *   · pedidos (verde) del rango de fechas elegido arriba, que llegan por el
 *     webhook `orders/create` de Shopify. Los de hace menos de 5 minutos laten
 *     y dibujan un arco desde España.
 *
 * Los pedidos vienen AGRUPADOS POR CIUDAD: un punto gordo son varios pedidos
 * del mismo sitio. Por eso los números de abajo salen de `ordersTotal` y
 * `ordersByCountry`, que cuentan pedidos de verdad, y no de contar puntos.
 *
 * El canvas se carga solo en el navegador: WebGL no existe en el servidor.
 */

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => <div className="w-full aspect-square" />,
});

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

const FECHA = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function AdminGlobe({ initialOnline }: { initialOnline: number }) {
  // Datos del poller compartido del panel (ver live-store.ts). Si la petición
  // falla, `lost` avisa y se queda congelado lo último que se supo.
  const { data, range, loadingRange, fresh, lost, loaded } = useLiveData();
  // Hasta que llega la primera respuesta manda el número que pintó el servidor.
  const online = loaded ? data.online : initialOnline;

  // El ranking llega ya calculado del servidor sobre TODOS los pedidos del
  // rango, no solo sobre los puntos que caben en el globo.
  const ranking = data.ordersByCountry;

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
        className="font-display uppercase tracking-tighter leading-none mb-3"
        style={{ fontSize: "clamp(1.25rem, 4vw, 1.75rem)" }}
      >
        De dónde vienen
      </h2>

      {/* Filtro de fechas, como el selector de periodo de Shopify. En móvil
          hace scroll lateral en vez de partirse en dos filas. */}
      <div
        role="group"
        aria-label="Periodo de los pedidos"
        className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 mb-4"
      >
        {ORDER_RANGES.map((r) => {
          const activo = r.id === range;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setOrderRange(r.id)}
              aria-pressed={activo}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors ${
                activo
                  ? "bg-ink text-bone"
                  : "bg-bone text-ink-soft hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>

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
          <dd className="tabular-nums font-semibold">{NUM.format(online)}</dd>
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-online" aria-hidden />
          <dt className="text-ink-soft">
            Pedidos ({orderRangeLabel(range).toLowerCase()})
          </dt>
          <dd
            className={`tabular-nums font-semibold transition-opacity ${
              loadingRange ? "opacity-40" : ""
            }`}
          >
            {NUM.format(data.ordersTotal)}
          </dd>
        </div>
      </dl>

      {fresh > 0 && (
        <p className="text-center text-xs text-ink-soft mt-2">
          {fresh === 1
            ? "1 sitio con pedido en los últimos 5 minutos."
            : `${NUM.format(fresh)} sitios con pedido en los últimos 5 minutos.`}
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

      {loaded && data.ordersTotal === 0 && !loadingRange && (
        <p className="text-center text-xs text-ink-soft/70 mt-3">
          Sin pedidos en este periodo. Los nuevos salen aquí solos.
        </p>
      )}

      {/* Desde cuándo hay datos. Importa decirlo: el histórico empieza el día
          que se dio de alta el webhook de pedidos en Shopify, así que "Todo"
          no son todos los pedidos de la tienda desde que abrió — son todos los
          que hemos visto pasar. Sin esta línea, un total bajo en "Todo" parece
          un fallo del panel en vez de lo que es. */}
      {data.ordersSince !== null && (
        <p className="text-center text-xs text-ink-soft/60 mt-3">
          Histórico desde el {FECHA.format(new Date(data.ordersSince))}.
        </p>
      )}
    </section>
  );
}
