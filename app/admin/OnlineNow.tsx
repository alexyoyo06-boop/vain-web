"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * "Hay N personas ahora mismo en la web", con el punto verde latiendo como en
 * el panel de Vercel. El número lo sirve /api/online (solo admin) y se refresca
 * cada 10 s mientras el panel esté a la vista.
 *
 * El valor inicial llega ya renderizado desde el servidor: nada de guiones ni
 * saltos al abrir el panel.
 */

const REFRESH_MS = 10_000;
const NUM = new Intl.NumberFormat("es-ES");

export default function OnlineNow({ initial }: { initial: number }) {
  const [online, setOnline] = useState(initial);
  const [lost, setLost] = useState(false);

  const load = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch("/api/online", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data: unknown = await res.json();
      const value =
        data && typeof data === "object" && "online" in data
          ? (data as { online: unknown }).online
          : null;
      if (typeof value !== "number") throw new Error("respuesta rara");
      setOnline(value);
      setLost(false);
    } catch {
      // Sin conexión (o sesión caducada): se congela el último número y el
      // punto se apaga, para no enseñar un dato que ya no es de ahora.
      setLost(true);
    }
  }, []);

  useEffect(() => {
    // También al montar: el valor que trae el servidor es solo para que el
    // hueco no salga vacío. El bueno es siempre el de la API.
    void load();
    const timer = setInterval(load, REFRESH_MS);
    document.addEventListener("visibilitychange", load);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [load]);

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
