"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Latido de presencia: le dice al servidor "esta pestaña sigue abierta" para
 * que el panel de admin pueda enseñar cuánta gente hay ahora mismo en la web
 * (ver lib/online-presence.ts).
 *
 * Es una petición mínima cada minuto y solo mientras la pestaña está a la
 * vista: quien deja la web abierta en segundo plano no cuenta ni gasta
 * invocaciones.
 *
 * Antes latía cada 20 s. Bajarlo a uno por minuto es x3 menos invocaciones por
 * visitante, y cada una no es barata: el POST lee, recorre y reescribe el mapa
 * entero de presencia (ver lib/online-presence.ts). Con la ventana en 3 min
 * (ONLINE_WINDOW_MS) al visitante le siguen sobrando dos latidos de margen
 * antes de desaparecer del contador.
 */

const HEARTBEAT_MS = 60_000;
const STORAGE_KEY = "vain_online_id";

let fallbackId = "";

/**
 * Id aleatorio por pestaña. En sessionStorage para que recargar no cuente como
 * visitante nuevo; si el navegador lo bloquea (modo privado, cookies off) se
 * usa uno en memoria. No identifica a nadie: es un número al azar que muere
 * con la pestaña.
 */
function visitorId(): string {
  const fresh = () => crypto.randomUUID().replace(/-/g, "");
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const id = fresh();
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    if (!fallbackId) fallbackId = fresh();
    return fallbackId;
  }
}

export default function OnlineBeacon() {
  const pathname = usePathname();
  // El panel no es tienda: quien lo está mirando no debe salir en su propio
  // contador de visitantes.
  const skip = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (skip) return;

    const ping = () => {
      if (document.visibilityState !== "visible") return;
      void fetch("/api/online", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: visitorId() }),
        keepalive: true,
      }).catch(() => {
        // Que el contador falle no puede molestar a quien está comprando.
      });
    };

    ping();
    const timer = setInterval(ping, HEARTBEAT_MS);
    // Al volver a la pestaña, latir ya: no esperar hasta 20 s para reaparecer.
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [skip]);

  return null;
}
