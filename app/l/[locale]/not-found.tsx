"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/lib/i18n/client";

// 404 de marca. Reemplaza la página por defecto de Next (que rompe el look
// bone/ink). Se ve cuando entran a una URL que no existe o a una ficha de
// producto borrada/agotada que ya no resuelve.
//
// Es un componente de CLIENTE porque `not-found.tsx` no recibe `params` con el
// idioma, y leerlo de la cookie en servidor volvería dinámica la ruta — justo
// lo que este refactor viene a evitar. El idioma lo saca del contexto que ya
// pone el layout, sin coste.
//
// Texto autocontenido (ES/EN) para no tener que añadir claves a los 11
// ficheros de messages por una página de borde. Quien no navega en español
// ve el inglés: para un alemán o un ruso es mucho más legible que el español,
// igual que hacemos con la pantalla de pago (ver checkoutLanguage()).
const COPY = {
  es: {
    tag: "Error 404",
    title: "Página no encontrada",
    body: "El enlace está roto o la prenda que buscas ya no está disponible.",
    cta: "Volver al inicio",
  },
  en: {
    tag: "Error 404",
    title: "Page not found",
    body: "This link is broken or the piece you’re looking for is no longer available.",
    cta: "Back to home",
  },
} as const;

export default function NotFound() {
  const locale = useLocale();
  const c = locale === "es" ? COPY.es : COPY.en;

  return (
    <main className="min-h-[100dvh] bg-bone text-ink flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-haze mb-5">
        {c.tag}
      </p>
      <h1
        className="font-display uppercase tracking-tighter leading-[0.95]"
        style={{ fontSize: "clamp(2.5rem, 12vw, 6rem)" }}
      >
        404
      </h1>
      <h2 className="mt-3 font-display uppercase tracking-tighter text-xl sm:text-2xl">
        {c.title}
      </h2>
      <p className="mt-3 max-w-sm text-sm sm:text-base text-ink-soft leading-snug">
        {c.body}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ink text-bone text-sm shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-transform"
      >
        <ArrowLeft className="size-4" strokeWidth={2.25} />
        {c.cta}
      </Link>
    </main>
  );
}
