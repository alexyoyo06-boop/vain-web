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
      {
        source: "/checkout/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/checkout/:path*`,
        permanent: false,
      },
      // Flujo de cuenta de cliente legacy / nuevo OAuth (login_with_shop).
      {
        source: "/a/:path*",
        destination: `https://${SHOPIFY_DOMAIN}/a/:path*`,
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
    ];
  },
};

export default nextConfig;
