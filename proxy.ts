// Next.js 16 Proxy (antes "middleware"). Intercepta todas las requests.
//
// Hace dos cosas:
//   1) Coming soon: si la web está cerrada y el visitante no tiene cookie
//      de early access, rewrite a /coming-soon.
//   2) Idioma: si no hay cookie de locale, la detecta (Accept-Language →
//      país x-vercel-ip-country → inglés) y la setea en la response.
//      La PRIMERA petición no tiene cookie todavía, pero no pasa nada:
//      getLocale() en server.ts hace la misma detección desde headers,
//      así que el primer render ya sale en el idioma correcto.

import { NextResponse, type NextRequest } from "next/server";
import { get } from "@vercel/edge-config";
import { LOCALE_COOKIE, isLocale, pickLocale } from "@/lib/i18n/config";

const LOCALE_COOKIE_OPTS = {
  httpOnly: false,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
} as const;

const ACCESS_COOKIE = "vain_early_access";

// Bots de redes sociales que escrapean OG tags. Si dejamos que el proxy los
// rewritea a /coming-soon, WhatsApp/X/Discord ven la home y no la ficha del
// producto compartido. Sin acceso al HTML real no hay preview chula —> se cae
// al favicon como thumbnail.
const SOCIAL_CRAWLER_RE = /\b(facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Discordbot|LinkedInBot|Slackbot|SkypeUriPreview|redditbot|Applebot|Googlebot|bingbot|Pinterestbot|vkShare|W3C_Validator|embedly|Iframely)\b/i;

function isSocialCrawler(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return SOCIAL_CRAWLER_RE.test(ua);
}

// Caché en memoria del flag de coming soon.
//
// Sin esto, CADA visita de alguien sin cookie de acceso es una lectura de Edge
// Config ("Global Config Reads": 50.000/mes gratis). Con el tráfico real de la
// web eso se come la cuota — Vercel avisó al 75% el 1 ago 2026 — y al 100% el
// proyecto se pausa, o sea la tienda cae. El flag sólo cambia cuando alguien
// le da al botón en /admin, así que no hace falta preguntarlo por visita.
//
// TTL asimétrico a propósito:
//   - ABIERTA: 15 min. Es el estado normal y el que se lleva todo el tráfico,
//     así que aquí está el ahorro. Coste: cerrar la web tarda hasta 15 min en
//     aplicarse en todas las instancias.
//   - CERRADA: 30 s. Con la web cerrada hay poco tráfico (pocas lecturas
//     igualmente) y lo que urge es que al abrir se note ya.
const OPEN_TTL_MS = 15 * 60_000;
const CLOSED_TTL_MS = 30_000;

let modeCache: { value: boolean; expiresAt: number } | null = null;

async function isClosed(): Promise<boolean> {
  const envFallback =
    (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";

  if (!process.env.EDGE_CONFIG) return envFallback;

  const now = Date.now();
  if (modeCache && now < modeCache.expiresAt) return modeCache.value;

  try {
    const value = (await get<boolean>("comingSoonMode")) ?? envFallback;
    modeCache = {
      value,
      expiresAt: now + (value ? CLOSED_TTL_MS : OPEN_TTL_MS),
    };
    return value;
  } catch {
    // Edge Config caído o cuota agotada: seguimos con el valor de env var y no
    // cacheamos, para reintentar en la siguiente request.
    return envFallback;
  }
}

function ensureLocaleCookie(
  request: NextRequest,
  response: NextResponse,
): void {
  const existing = request.cookies.get(LOCALE_COOKIE)?.value;
  if (existing && isLocale(existing)) return;
  // Detección unificada (idioma del dispositivo → país IP → inglés).
  // Misma lógica que getLocale() en server.ts — ver pickLocale().
  const locale = pickLocale(
    request.headers.get("accept-language"),
    request.headers.get("x-vercel-ip-country"),
  );
  response.cookies.set(LOCALE_COOKIE, locale, LOCALE_COOKIE_OPTS);
}

/**
 * URLs con prefijo de idioma (`/en`, `/de/todo`, `/pt-pt/pants/x`). Esta web
 * NO usa prefijos: el idioma va en cookie. Pero Shopify sí los genera — el
 * botón "Seguir comprando" del checkout en inglés apunta a `www.v4in.com/en`
 * — y también los pegan quienes copian la URL del switcher de la tienda.
 * Antes eran 404. Ahora: quitamos el prefijo y dejamos el idioma en la cookie,
 * así el visitante aterriza en la página buena y encima en su idioma.
 *
 * Ojo: las rutas de Shopify con prefijo (`/en/cart/c/…`, `/en/checkouts/…`)
 * las capturan los redirects de next.config.ts, que corren ANTES del proxy.
 */
function stripLocalePrefix(request: NextRequest): NextResponse | null {
  const segments = request.nextUrl.pathname.split("/");
  const first = (segments[1] ?? "").toLowerCase();
  // Estricto a propósito: "en" o "en-gb" y nada más. Si aceptáramos cualquier
  // cosa antes del guion, un fichero como /el-fondo.png se leería como griego
  // ("el") y acabaría redirigido a la home.
  if (!/^[a-z]{2}(-[a-z]{2})?$/.test(first)) return null;
  const base = first.slice(0, 2);
  if (!isLocale(base)) return null;

  const url = request.nextUrl.clone();
  url.pathname = "/" + segments.slice(2).join("/");
  const res = NextResponse.redirect(url, 307);
  res.cookies.set(LOCALE_COOKIE, base, LOCALE_COOKIE_OPTS);
  return res;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localeRedirect = stripLocalePrefix(request);
  if (localeRedirect) return localeRedirect;

  // Permitir siempre estas rutas (no bloquear coming-soon)
  if (
    pathname.startsWith("/coming-soon") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // Imágenes de metadata (opengraph-image, twitter-image, icon, apple-icon).
    // No llevan extensión en la URL (`/opengraph-image?<hash>`), así que el
    // check de estáticos de abajo no las pilla. Son assets públicos, NO páginas:
    // hay que servir el PNG SIEMPRE, aunque la web esté cerrada y aunque la
    // petición de la imagen no traiga UA de bot — si no, el crawler la pide sin
    // UA social, el proxy la reescribe a /coming-soon y la preview sale sin foto.
    /\/(opengraph-image|twitter-image|icon|apple-icon)$/.test(pathname) ||
    // archivos estáticos por extensión
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  // Suscriptor con password ya canjeada pasa
  if (request.cookies.get(ACCESS_COOKIE)?.value === "1") {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  if (!(await isClosed())) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  // Bots de redes sociales (WhatsApp, X, Discord, etc.): que vean el HTML
  // real con la metadata correcta del producto. Necesario para que la
  // preview al compartir muestre la OG image bonita en vez del favicon.
  if (isSocialCrawler(request)) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  // Bloqueado → rewrite (mantiene la URL en la barra, sirve coming-soon).
  // Como es un rewrite (no redirect), la URL del navegador sigue siendo "/",
  // así que usePathname() en cliente NO ve "/coming-soon". Marcamos la request
  // con una cabecera para que el layout sepa que está sirviendo el muro y NO
  // monte el popup del 10% encima (si no, salta aunque la web esté cerrada).
  const url = request.nextUrl.clone();
  url.pathname = "/coming-soon";
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-vain-wall", "1");
  const res = NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
  ensureLocaleCookie(request, res);
  return res;
}

export const config = {
  matcher: [
    // Todo excepto API, _next, archivos estáticos
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
