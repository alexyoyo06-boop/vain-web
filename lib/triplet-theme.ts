// Cápsula "V TRIPLETS": cada pantalón tiene un color de marca (rosa/gris/azul).
// El color se usa SOLO como acento (logo, glow, título, paginación de fotos),
// nunca para pintar fondos ni el botón de comprar. Fuente única de verdad para
// TripletsHero (home) y la ficha de producto.

/** Slug en Shopify → color de acento del triplet. */
export const TRIPLET_COLORS: Record<string, string> = {
  "the-pink-triplet": "#F2A0C0", // rosa
  "the-grey-triplet": "#C3C6CB", // gris
  "the-blue-triplet": "#16294C", // azul marino
};

/** Color del TÍTULO en la ficha. Igual al acento salvo el gris, que se oscurece
 *  para que se lea sobre fondo claro (el acento real es demasiado pálido). */
export const TRIPLET_TITLE_COLORS: Record<string, string> = {
  "the-pink-triplet": "#F2A0C0",
  "the-grey-triplet": "#8C9097",
  "the-blue-triplet": "#16294C",
};

export function tripletTitleColor(slug: string): string | null {
  return TRIPLET_TITLE_COLORS[slug] ?? null;
}

/** Orden canónico para el abanico de la home (izquierda → derecha). */
export const TRIPLET_ORDER = [
  "the-pink-triplet",
  "the-grey-triplet",
  "the-blue-triplet",
] as const;

/** Color de acento de un slug, o null si no es un triplet. */
export function tripletColor(slug: string): string | null {
  return TRIPLET_COLORS[slug] ?? null;
}
