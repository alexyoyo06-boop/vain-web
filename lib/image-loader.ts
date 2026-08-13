"use client";

/**
 * De dónde se sirven las fotos ya redimensionadas.
 *
 * POR QUÉ EXISTE: Vercel avisó de que el plan gratis se estaba comiendo la
 * cuota de Image Optimization (300.000 lecturas de caché al mes, al 75%). Y
 * casi todas esas fotos son de productos, que ya viven en el CDN de Shopify —
 * un CDN que redimensiona solo, gratis y sin límite de tráfico:
 *
 *     banner-1.jpg              549.295 bytes
 *     banner-1.jpg?width=400     23.335 bytes
 *
 * O sea que se estaba pagando cuota de Vercel por un trabajo que Shopify ya
 * hace. Es el mismo razonamiento que llevó los vídeos a su CDN (ver
 * lib/media.ts): el peso que pueda llevar Shopify, lo lleva Shopify.
 *
 * QUÉ HACE: a las fotos de cdn.shopify.com les pone el `width` que pide Next y
 * las sirve directas desde ahí, sin pasar por el optimizador de Vercel. El
 * resto —las de public/, como el archivo o el logo— siguen por el camino de
 * siempre, que para eso están en nuestro servidor.
 *
 * OJO: se mantiene el srcset. Next llama a esta función una vez por cada ancho
 * de pantalla, así que un móvil sigue bajando la versión pequeña. Con
 * `unoptimized` se habría perdido eso y el móvil se tragaría la foto grande.
 */

type LoaderArgs = {
  src: string;
  width: number;
  quality?: number;
};

const SHOPIFY_CDN = "cdn.shopify.com";

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.includes(SHOPIFY_CDN)) {
    try {
      const url = new URL(src);

      // OJO, ESTO ES LO QUE HACE QUE FUNCIONE. Shopify sirve las fotos con el
      // tamaño metido EN EL NOMBRE (…-doblado_1600x.png). Sobre una URL así,
      // el `?width=` se IGNORA: pedí 400, 828 y 1200 y las tres devolvieron el
      // mismo fichero de 2 MB. O sea que sin quitar ese sufijo, cada móvil se
      // tragaría la foto a tamaño completo — peor que ahora.
      //
      // Quitándolo, el `?width=` sí manda:  400px → 155 KB   1200px → 1,3 MB
      // Y como Shopify negocia formato, un navegador moderno recibe WebP:
      //   the-pink-triplet_1600x.png        2.013.568 bytes
      //   …sin sufijo, ?width=400, WebP        21.826 bytes
      url.pathname = url.pathname.replace(/_\d+x(\d+)?(?=\.[a-z]+$)/i, "");

      // Se respeta el `?v=...` que ya trae (es su versión de fichero: sin él,
      // Shopify puede servir una copia cacheada vieja tras cambiar la foto).
      url.searchParams.set("width", String(width));
      return url.toString();
    } catch {
      // URL rara: mejor servirla tal cual que romper la foto.
      return src;
    }
  }

  // Todo lo demás (public/) sigue por el optimizador de Next, que es lo
  // correcto: esas fotos no están en ningún CDN que sepa redimensionarlas.
  const q = quality ?? 75;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
