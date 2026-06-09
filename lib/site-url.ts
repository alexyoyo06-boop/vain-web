// URL canónica del sitio. Fuente única para metadata, OG, robots y sitemap.
//
// VERCEL_PROJECT_PRODUCTION_URL = alias estable del proyecto (vain-web.vercel.app),
// público sin Deployment Protection. VERCEL_URL es la del deployment puntual y suele
// estar protegida, así que NO sirve para que WhatsApp/X scrapeen OG images ni para
// que los crawlers sigan el sitemap.
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000"
  );
}
