/**
 * La imagen que sale al compartir el enlace de la web (WhatsApp, X, TikTok,
 * Discord…). La dibuja `app/opengraph-image.tsx`.
 *
 * POR QUÉ ESTÁ DECLARADA A MANO y no se deja que Next la detecte sola: el
 * fichero que la dibuja vive en la raíz de `app/`, FUERA del árbol de idiomas
 * (el porqué, largo, está en ese fichero). Y Next solo engancha las imágenes de
 * metadata que encuentra del layout raíz hacia abajo; como el layout raíz es
 * `app/l/[locale]/layout.tsx`, un fichero por encima le queda fuera de vista.
 * Sin esto las páginas se quedan sin `og:image` y `twitter:card` baja de
 * `summary_large_image` a `summary` — o sea, preview sin foto.
 *
 * OJO AL AÑADIR `openGraph` O `twitter` EN UNA PÁGINA NUEVA: lo que declara la
 * página SUSTITUYE a lo del layout, no se suma. Si una página define su propio
 * `openGraph` (para poner otro título, por ejemplo) y no repite `images`, se
 * queda sin foto al compartirla. Por eso la portada la importa también.
 *
 * La URL va sin hash de contenido, así que si algún día se cambia el dibujo hay
 * que forzar el re-escrapeo en cada red (o cambiar la ruta) para que no se
 * queden con la vieja cacheada.
 */
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "VAIN",
  type: "image/jpeg",
} as const;
