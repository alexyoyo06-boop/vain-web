import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// robots.txt generado. Le dice a Google qué NO indexar:
//   - /admin       → panel privado del dueño
//   - /cart        → carrito, no es contenido indexable
//   - /api         → endpoints (webhook revalidate, etc.)
//   - rutas que reenviamos a Shopify (checkout, cuenta, services)
// El resto (home, fichas de producto, políticas) es indexable.
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/cart",
        "/api/",
        "/a/",
        "/checkout",
        "/checkouts/",
        "/services/",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
