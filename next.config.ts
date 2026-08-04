import type { NextConfig } from "next";

const securityHeaders = [
  // Fuerza HTTPS durante 1 año tras la primera visita (evita SSL-strip).
  // Sin includeSubDomains/preload a propósito: otros subdominios de v4in.com
  // podrían no servir HTTPS y no queremos romperlos ni meternos en la lista
  // de preload (difícil de revertir).
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // va.vercel-scripts.com = Analytics/Speed Insights en dev (en prod se
      // sirven same-origin vía /_vercel/* y los cubre 'self').
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // media-src: SIN esta línea el vídeo del banner no se ve. Los .mp4 viven
      // en el CDN de Shopify (ver lib/media.ts) y, al no haber regla propia,
      // caían en `default-src 'self'` → el navegador ni siquiera los pedía
      // ("Media load rejected by URL safety check"). Se ponía el póster fijo y
      // parecía que el vídeo simplemente no arrancaba. Solo se abre a Shopify,
      // no a cualquier origen.
      "media-src 'self' https://cdn.shopify.com",
      // gstatic = decoder Draco (logo 3D coming-soon).
      // worker-src blob: → React Three Fiber crea workers en blob URLs.
      "connect-src 'self' https://www.gstatic.com",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const SHOPIFY_DOMAIN =
  process.env.SHOPIFY_STORE_DOMAIN ?? "vainspn.myshopify.com";

const nextConfig: NextConfig = {
  // La página /archivo lee las fotos de public/archivo con fs en runtime.
  // En Vercel, public/ no entra por defecto en la función → hay que incluir
  // explícitamente esa carpeta para que readdirSync la encuentre.
  outputFileTracingIncludes: {
    "/archivo": ["./public/archivo/**/*"],
  },
  images: {
    // Las fotos de productos vienen del CDN de Shopify.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    // Rutas que sirve Shopify, no Next. checkoutUrl que devuelve la Cart API
    // viene como `v4in.com/cart/c/{cartId}` porque v4in.com es el primary
    // domain en Shopify Admin, pero DNS apunta a Vercel → caería en 404.
    // Redirigimos a vainspn.myshopify.com que tiene tipo "Alias de dominio"
    // (importante: NO "Redirección", o crea loop infinito).
    return [
      {
        source: "/cart/c/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/cart/c/:path*`,
        permanent: false,
      },
      {
        source: "/checkouts/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/checkouts/:path*`,
        permanent: false,
      },
      // Mismas rutas con prefijo de idioma. Cuando el carrito se pide a Shopify
      // en un idioma que la tienda tiene publicado, el checkoutUrl vuelve como
      // `v4in.com/en/cart/c/{id}` — con el prefijo delante. Sin estas reglas la
      // pantalla de pago en inglés da 404. `:lang` son 2 letras (en) o 2-2
      // (pt-br), así que nunca choca con /pants/…, /hoodies/… ni /policies/….
      {
        source: "/:lang([a-z]{2}|[a-z]{2}-[a-z]{2})/cart/c/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/:lang/cart/c/:path*`,
        permanent: false,
      },
      {
        source: "/:lang([a-z]{2}|[a-z]{2}-[a-z]{2})/checkouts/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/:lang/checkouts/:path*`,
        permanent: false,
      },
      {
        source: "/checkout/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/checkout/:path*`,
        permanent: false,
      },
      // Rutas con el ID de tienda delante: `/96649576786/orders/{token}/authenticate?key=…`.
      // Es el enlace del botón "Ver estado del pedido" de los emails de
      // confirmación y de envío (order_status_url), que Shopify genera con el
      // primary domain (www.v4in.com) → llegaba a Next y daba 404 al cliente
      // justo después de pagar. Mismo patrón para facturas de pedidos borrador
      // (/invoices/…) y demás rutas shop-scoped. Ningún :path de esta web
      // empieza por dígitos, así que la regla no puede pisar rutas nuestras.
      // La query (?key=…) la reenvía Next sola: el destino no lleva query.
      {
        source: "/:shopId(\\d+)/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/:shopId/:path*`,
        permanent: false,
      },
      {
        source: "/:lang([a-z]{2}|[a-z]{2}-[a-z]{2})/:shopId(\\d+)/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/:lang/:shopId/:path*`,
        permanent: false,
      },
      // Flujo de cuenta de cliente legacy / nuevo OAuth (login_with_shop).
      {
        source: "/a/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/a/:path*`,
        permanent: false,
      },
      // Más rutas que sirve Shopify desde el dominio principal y que aquí eran
      // 404. Salieron de Vercel Analytics (visitas reales de clientes, 31 días):
      //   /o/{hash}/a/{token}  → enlace CORTO de las notificaciones. Es el que
      //     va en el SMS de confirmación/envío (el del número de seguimiento).
      //     En Shopify hace 302 a account.v4in.com/orders/{hash}/authenticate.
      //     Sin esta regla, quien compra dejando solo el móvil pincha el SMS y
      //     se come un 404 en vez de ver su pedido.
      //   /customer_authentication/*  → login de la cuenta de cliente (redirect,
      //     sso_hint). Era el 404 más visitado de todos.
      //   /customer_identity/*        → logout de esa misma cuenta.
      //   /payment_providers/*        → vuelta del proveedor de pago tras pagar
      //     (visto con Klarna vía Stripe). 404 aquí = pago que parece fallido.
      //   /wallets/*, /gift_cards/*   → Shop Pay y tarjetas regalo, mismo caso.
      // Ninguna choca con rutas nuestras. Las variantes con idioma delante
      // (/en/o/…) las resuelve el proxy, que quita el prefijo y vuelve a pasar
      // por aquí.
      {
        source:
          "/:shopifyRoute(o|customer_authentication|customer_identity|payment_providers|wallets|gift_cards)/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/:shopifyRoute/:path*`,
        permanent: false,
      },
      // Cuenta de cliente Shopify (subdominio nuevo account.v4in.com; incl.
      // autoservicio de devolución/desistimiento). Atajo por si algo enlaza a /account.
      {
        source: "/account/:path*",
        destination: "https://account.v4in.com/:path*",
        permanent: false,
      },
      {
        source: "/account",
        destination: "https://account.v4in.com",
        permanent: false,
      },
      {
        source: "/services/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/services/:path*`,
        permanent: false,
      },
      // Índices de categoría. No existen como página propia (el catálogo es
      // pequeño y /todo ya lo lista entero), pero es la URL natural si alguien
      // recorta la de una ficha: /pants/the-grey-triplet → /pants. Daban 404.
      {
        source: "/:category(hoodies|tees|pants|headwear)",
        destination: "/todo",
        permanent: false,
      },
      // URLs de la tienda Shopify que vivió en este dominio antes que esta web
      // (siguen pegadas en TikToks y en el índice de Google). /collections/{h}
      // es el mismo handle que usa nuestra ruta /c/{h}. Las de producto las
      // resuelve app/products/[handle]/page.tsx, que necesita mirar la
      // categoría real en Shopify para armar /{categoria}/{slug}.
      {
        source: "/collections",
        destination: "/todo",
        permanent: false,
      },
      {
        source: "/collections/all",
        destination: "/todo",
        permanent: false,
      },
      {
        source: "/collections/:handle",
        destination: "/c/:handle",
        permanent: false,
      },
      // Enlaces de descuento (popup del 10%): /discount/CODE los sirve Shopify,
      // que aplica el código y redirige al carrito. Sin esto darían 404 en Next.
      {
        source: "/discount/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/discount/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
