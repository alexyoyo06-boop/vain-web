// Carga el diccionario del idioma activo. SOLO server-side.
// Para client components: el provider en LocaleProvider.tsx pasa el
// diccionario por contexto.

import "server-only";
import type { Locale } from "./config";

const loaders = {
  es: () => import("@/messages/es.json").then((m) => m.default),
  en: () => import("@/messages/en.json").then((m) => m.default),
  fr: () => import("@/messages/fr.json").then((m) => m.default),
  it: () => import("@/messages/it.json").then((m) => m.default),
  de: () => import("@/messages/de.json").then((m) => m.default),
  pt: () => import("@/messages/pt.json").then((m) => m.default),
  nl: () => import("@/messages/nl.json").then((m) => m.default),
  pl: () => import("@/messages/pl.json").then((m) => m.default),
  el: () => import("@/messages/el.json").then((m) => m.default),
  ru: () => import("@/messages/ru.json").then((m) => m.default),
  ar: () => import("@/messages/ar.json").then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<typeof loaders.es>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loaders[locale]();
}

/** Reemplaza placeholders `{var}` por valores. Sin pluralización. */
export function tpl(
  s: string,
  vars: Record<string, string | number> = {},
): string {
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
