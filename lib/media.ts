// Vídeos y pósters pesados servidos desde el CDN de Shopify.
//
// POR QUÉ NO ESTÁN EN public/: los <video> se sirven CRUDOS (no pasan por
// next/image, que sí encoge las fotos). El banner de la portada son 2 MB que se
// descarga cada visitante: un día de 1.100 visitas = 2,3 GB, y el plan Hobby de
// Vercel da 100 GB/mes. El CDN de Shopify no tiene límite de tráfico y ya está
// pagado con la suscripción de la tienda, así que ese peso lo lleva él.
// Ver también proxy.ts, donde se arregló lo mismo con las lecturas de Edge Config.
//
// Los archivos originales SIGUEN en public/ (hero/ y coming/) como respaldo: si
// alguna vez hay que volver atrás, basta con poner aquí las rutas locales.
//
// PARA CAMBIAR UN VÍDEO: súbelo en Shopify → Contenido → Archivos, copia su
// enlace (el icono de cadena) y pégalo aquí entero, con el "?v=..." si lo lleva.
// Ojo: Shopify renombra los .mp4 a un hash sin sentido; identifícalos por el
// nombre que muestra el panel, no por la URL.

/** Banner de la portada (PhotoHero). Apaisado 16:9, mudo y en bucle. */
export const HERO_VIDEO =
  "https://cdn.shopify.com/videos/c/o/v/2d0d419a9207428d91471d2ec5373de8.mp4";
export const HERO_POSTER =
  "https://cdn.shopify.com/s/files/1/0966/4957/6786/files/banner-1.jpg?v=1785672821";

/** Muro de la pantalla de "cerrado" (ComingSoon). Dos recortes del mismo montaje. */
export const WALL_MEDIA = {
  mobile: {
    src: "https://cdn.shopify.com/videos/c/o/v/df936e20d0034b319df02f236050febf.mp4",
    poster:
      "https://cdn.shopify.com/s/files/1/0966/4957/6786/files/wall-mobile.jpg?v=1785672819",
  },
  desktop: {
    src: "https://cdn.shopify.com/videos/c/o/v/da732011ac564db181b9dae7f5e02365.mp4",
    poster:
      "https://cdn.shopify.com/s/files/1/0966/4957/6786/files/wall-desktop.jpg?v=1785672819",
  },
} as const;
