"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Recuerda de qué ruta interna venía el usuario dentro de la misma sesión de
 * navegación. Hace falta porque con navegación cliente (next/link)
 * `document.referrer` no se actualiza: se queda con la del documento inicial.
 *
 * Lo usa la ficha de producto para que "Volver a X" apunte al sitio real
 * desde el que se llegó (el drop, una colección, el archivo…) en vez de a un
 * destino fijo. Al recargar en duro no hay ruta previa y se cae al fallback.
 *
 * El estado vive fuera de React (store de módulo + useSyncExternalStore) para
 * que actualizarlo desde el efecto de navegación no dispare renders en
 * cascada en quien lo lee.
 */

let prevRoute: string | null = null;
let currentRoute: string | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): string | null {
  return prevRoute;
}

function getServerSnapshot(): string | null {
  return null;
}

/** Ruta interna anterior, o null si se ha entrado directo a esta página. */
export function usePrevRoute(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default function RouteMemory() {
  const pathname = usePathname();

  useEffect(() => {
    if (currentRoute === pathname) return;
    if (currentRoute) prevRoute = currentRoute;
    currentRoute = pathname;
    for (const listener of listeners) listener();
  }, [pathname]);

  return null;
}
