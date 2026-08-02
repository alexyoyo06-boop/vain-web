"use client";

import ReactDOM from "react-dom";

/**
 * Abre la conexión con el CDN de Shopify antes de que haga falta.
 *
 * De ahí vienen el vídeo del banner, sus pósters y todas las fotos de producto
 * (ver lib/media.ts). Sin esto, el DNS + TLS de ese tercer origen se paga justo
 * cuando toca empezar a pintar la portada, y el banner tarda más en aparecer.
 *
 * No pinta nada. Va con `ReactDOM.preconnect` y no con un `<link>` a mano
 * porque es lo que manda esta versión de Next (ver la tabla de "Resource hints"
 * en node_modules/next/dist/docs — el `<link rel="preconnect">` escrito a mano
 * en un layout no está soportado).
 */
export default function ResourceHints() {
  ReactDOM.preconnect("https://cdn.shopify.com");
  return null;
}
