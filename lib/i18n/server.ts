// Helpers server-side para leer el idioma activo del request.
// La cookie la pone el proxy (detección geo) o el switcher.

import "server-only";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  pickLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionary";

export async function getLocale(): Promise<Locale> {
  // `cookies()`/`headers()` lanzan si se llaman fuera de un request (build
  // time, generateStaticParams, etc.). En ese caso usamos el default.
  try {
    const jar = await cookies();
    const raw = jar.get(LOCALE_COOKIE)?.value;
    if (raw && isLocale(raw)) return raw;
    // Primera visita: la cookie aún no existe (el proxy la setea en la
    // RESPONSE, no en esta request). Detectamos aquí con la misma lógica
    // para que ya el primer render salga en el idioma correcto en vez de
    // servir el default a todo el mundo.
    const h = await headers();
    return pickLocale(
      h.get("accept-language"),
      h.get("x-vercel-ip-country"),
    );
  } catch {
    // Sin contexto de request — fallback silencioso.
  }
  return DEFAULT_LOCALE;
}

export async function getT(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  return { locale, t };
}
