"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";

// Sin suscripción real: solo necesitamos un snapshot del idioma tras montar.
// useSyncExternalStore evita el mismatch de hidratación (server=ES) y la
// cascada de renders de un setState dentro de useEffect.
const noopSubscribe = () => () => {};

// Error boundary de marca. Salta si una página revienta en runtime (p.ej.
// Shopify devuelve algo inesperado). Sustituye la pantalla de error genérica
// de Next por una coherente con el look bone/ink, sin filtrar el stack.
//
// Es Client Component (requisito de Next para error.tsx). Para el idioma
// leemos el `lang` del <html> que fijó el layout, en vez de depender del
// diccionario server-only.
const COPY = {
  es: {
    title: "Algo ha fallado",
    body: "Ha habido un problema cargando esta página. Prueba de nuevo en un momento.",
    retry: "Reintentar",
    home: "Volver al inicio",
  },
  en: {
    title: "Something went wrong",
    body: "There was a problem loading this page. Please try again in a moment.",
    retry: "Try again",
    home: "Back to home",
  },
} as const;

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isEn = useSyncExternalStore(
    noopSubscribe,
    () => document.documentElement.lang === "en",
    () => false,
  );

  useEffect(() => {
    // Útil para depurar en Vercel logs / consola sin enseñar nada al usuario.
    console.error(error);
  }, [error]);

  const c = isEn ? COPY.en : COPY.es;

  return (
    <main className="min-h-[100dvh] bg-bone text-ink flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display uppercase tracking-tighter text-2xl sm:text-3xl">
        {c.title}
      </h1>
      <p className="mt-3 max-w-sm text-sm sm:text-base text-ink-soft leading-snug">
        {c.body}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-bone text-sm shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <RotateCw className="size-4" strokeWidth={2.25} />
          {c.retry}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink/5 hover:bg-ink/10 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          {c.home}
        </Link>
      </div>
    </main>
  );
}
