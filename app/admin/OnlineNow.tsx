"use client";

import { useLiveData } from "./live-store";

/**
 * "Hay N personas ahora mismo en la web", con el punto verde latiendo como en
 * el panel de Vercel. El número sale del poller compartido del panel (ver
 * live-store.ts), que pide /api/online una vez cada 30 s para todo el panel.
 *
 * El valor inicial llega ya renderizado desde el servidor: nada de guiones ni
 * saltos al abrir el panel. En cuanto entra la primera respuesta manda esa.
 */

const NUM = new Intl.NumberFormat("es-ES");

export default function OnlineNow({ initial }: { initial: number }) {
  const { data, lost, loaded } = useLiveData();
  // Sin conexión (o sesión caducada): se congela el último número y el punto
  // se apaga, para no enseñar un dato que ya no es de ahora.
  const online = loaded ? data.online : initial;

  const live = !lost && online > 0;

  return (
    <p
      className="inline-flex items-center gap-2 rounded-full bg-bone px-3 py-2"
      title={
        lost
          ? "No se ha podido actualizar el número de gente online."
          : "Gente con la web abierta en el último minuto. Se actualiza sola."
      }
    >
      <span className="relative flex size-2.5 shrink-0">
        {live && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-online opacity-60 animate-ping motion-reduce:hidden"
            aria-hidden
          />
        )}
        <span
          className={`relative inline-flex size-2.5 rounded-full ${
            live ? "bg-online" : "bg-haze"
          }`}
          aria-hidden
        />
      </span>
      <span className="text-sm tabular-nums font-semibold leading-none">
        {NUM.format(online)}
      </span>
      <span className="text-xs uppercase tracking-widest text-ink-soft leading-none">
        online
      </span>
    </p>
  );
}
