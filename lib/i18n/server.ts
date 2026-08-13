// Helpers server-side para el idioma.
//
// HAY DOS CAMINOS Y NO SE PUEDEN MEZCLAR:
//
//   1. PÁGINAS Y LAYOUTS → el idioma viene en `params`, del segmento de la URL
//      interna (`/l/es/todo`). No se lee ninguna cookie, y por eso Next puede
//      pre-generar las 11 copias de cada página en el despliegue y servirlas
//      sin gastar CPU por visita. Usan `getDictionary(locale)` directamente.
//
//   2. SERVER ACTIONS Y ROUTE HANDLERS → ahí no hay `params` de idioma, y
//      además ya son dinámicos por naturaleza (procesan un envío, escriben una
//      cookie…). Esos sí leen la cookie, con las funciones de abajo.
//
// La regla: si lo llamas desde algo que se pinta, lo estás rompiendo. Leer la
// cookie en una página la vuelve dinámica otra vez y tira por tierra todo el
// trabajo de pre-generarlas — que es exactamente el problema que tenía esta
// web (14 minutos de CPU al día, 86% de la cuota mensual).

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

/**
 * Idioma del visitante según su cookie. SOLO para server actions y route
 * handlers: llamarlo desde una página la vuelve dinámica.
 */
export async function getRequestLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const raw = jar.get(LOCALE_COOKIE)?.value;
    if (raw && isLocale(raw)) return raw;
    // Primera visita: la cookie aún no existe (el proxy la pone en la
    // RESPONSE, no en esta request). Se detecta aquí con la misma lógica.
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

/**
 * Idioma + diccionario del visitante según su cookie. SOLO para server actions
 * y route handlers, por lo mismo que `getRequestLocale`.
 */
export async function getRequestT(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, t: await getDictionary(locale) };
}
