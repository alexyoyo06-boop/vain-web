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

/** Orden canónico en la home (izquierda → derecha). Es el mismo en el que
 *  aparecen en la foto del banner de portada, para que la fila de abajo se lea
 *  como continuación de la foto. Si cambias la foto, cambia esto. */
export const TRIPLET_ORDER = [
  "the-grey-triplet",
  "the-blue-triplet",
  "the-pink-triplet",
] as const;

/**
 * Ajuste fino del tamaño de la foto en la home, por slug.
 *
 * PARCHE TEMPORAL: las fotos que hay ahora en Shopify no están normalizadas
 * entre sí — la del azul tiene más aire alrededor de la prenda, así que se veía
 * más pequeña que la del gris y la del rosa puestas en fila. Cuando se suban
 * las fotos nuevas (todas recortadas con la prenda al 78% del alto) esto sobra:
 * se vacía el objeto y todas miden igual solas.
 */
export const TRIPLET_PHOTO_SCALE: Record<string, number> = {
  "the-blue-triplet": 1.15,
};

/** Color de acento de un slug, o null si no es un triplet. */
export function tripletColor(slug: string): string | null {
  return TRIPLET_COLORS[slug] ?? null;
}
