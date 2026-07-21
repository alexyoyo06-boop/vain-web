import type { Dictionary } from "./i18n/dictionary";

/**
 * Título de una colección en el idioma del visitante.
 *
 * Shopify devuelve el título tal cual está escrito en Admin (en español:
 * "Pantalones", "Camisetas", "Sudaderas") porque la tienda no tiene traducidas
 * las colecciones. Hasta que se traduzcan allí, las fijas se traducen aquí por
 * handle. Una colección nueva que cree el merchant sale con su título de
 * Shopify, que es el comportamiento correcto: mejor el nombre real que nada.
 */
export function collectionLabel(
  t: Dictionary,
  handle: string,
  fallback: string,
): string {
  const names = t.collectionNames as Record<string, string | undefined>;
  return names[handle] ?? fallback;
}
