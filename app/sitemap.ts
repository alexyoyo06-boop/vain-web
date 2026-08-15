import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { getVisibleProducts } from "@/lib/products-server";
import { productHref } from "@/lib/products";

// Sitemap generado dinámicamente. Combina rutas estáticas públicas con la
// ficha de cada producto visible en Shopify. Si Shopify falla durante el
// build, devolvemos al menos las rutas estáticas en vez de romper el deploy.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/archivo`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/policies/terms-of-service`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/privacy-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/refund-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/shipping-policy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/legal-notice`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/contact-information`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/policies/withdrawal`, changeFrequency: "yearly", priority: 0.2 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    // Los agotados también van al sitemap: su ficha sigue existiendo y
    // enseñando el producto. Con `getAvailableProducts` desaparecían del índice
    // en cuanto se agotaban, Google los desindexaba, y recuperar esa posición
    // cuesta semanas — para un drop que se repone, es tirar el SEO.
    const products = await getVisibleProducts();
    productRoutes = products.map((p) => ({
      url: `${base}${productHref(p)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // Shopify caído / sin credenciales en build → solo rutas estáticas.
  }

  return [...staticRoutes, ...productRoutes];
}
