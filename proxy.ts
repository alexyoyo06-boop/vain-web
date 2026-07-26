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

async function isClosed(): Promise<boolean> {
  const envFallback =
    (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";

  if (!process.env.EDGE_CONFIG) return envFallback;

  try {
    const mode = await get<boolean>("comingSoonMode");
    return mode ?? envFallback;
  } catch {
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
  response.cookies.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
