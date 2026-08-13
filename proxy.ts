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
import { LOCALE_COOKIE, isLocale, pickLocale, type Locale } from "@/lib/i18n/config";

/**
 * Prefijo interno del árbol de páginas. Las URLs públicas NO lo llevan: el
 * proxy reescribe `/todo` → `/l/es/todo` por dentro y el visitante sigue
 * viendo `v4in.com/todo`.
 *
 * POR QUÉ UNA LETRA Y NO `/es/` A SECAS: `/es/...` ya significa otra cosa aquí
 * — el checkout de Shopify genera enlaces con prefijo de idioma y el proxy los
 * redirige quitándolo (ver stripLocalePrefix). Si el árbol interno viviera en
 * `/es/`, las dos reglas se pisarían. Una letra suelta no puede confundirse
 * con un código de idioma, así que las dos conviven sin tocarse.
 */
const RENDER_PREFIX = "/l";

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

// El flag de coming soon sale de una env var. CERO lecturas de red.
//
// Historia, para que no se repita: esto leía "comingSoonMode" de Edge Config en
// cada visita (1 visita = 1 "Global Config Read"; el plan gratis da 50.000/mes
// y al pasarse Vercel PAUSA el proyecto, o sea la tienda cae). El 2 ago 2026 se
// metió una caché en memoria con TTL de 15 min, y aun así el 6 ago se llegó al
// 100% de la cuota. Motivo: la caché vive dentro del isolate que atiende la
// request, y los isolates del proxy son efímeros y hay muchos a la vez (varias
// regiones, arranques en frío). Con tráfico repartido, casi cada visita cae en
// un isolate nuevo con la caché vacía → volvía a leer. Una caché en memoria NO
// arregla una cuota en un runtime así.
//
// Coste de esto: cerrar la web ya no es un botón en /admin — hay que cambiar
// EARLY_ACCESS_MODE a "on" en Vercel y redesplegar (~2 min). Se cierra la web
// una vez cada varios meses; la cuota se gasta cada día.
function isClosed(): boolean {
  return (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";
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

/** El idioma del visitante: su cookie si la tiene, si no lo que digan sus
 *  cabeceras (idioma del dispositivo → país de la IP → inglés). */
function localeOf(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) return cookie;
  return pickLocale(
    request.headers.get("accept-language"),
    request.headers.get("x-vercel-ip-country"),
  );
}

/**
 * Reescribe a la copia del idioma que toca. La URL de la barra no cambia.
 * `extraPath` permite mandar a otra página (el muro) manteniendo la URL.
 */
function renderIn(
  request: NextRequest,
  locale: Locale,
  extraPath?: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = `${RENDER_PREFIX}/${locale}${extraPath ?? request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Peticiones que YA vienen reescritas (o que alguien ha escrito a mano):
  // se dejan pasar tal cual. Sin esto se reescribirían otra vez y saldría
  // /l/es/l/es/todo.
  if (pathname === RENDER_PREFIX || pathname.startsWith(`${RENDER_PREFIX}/`)) {
    return NextResponse.next();
  }

  const localeRedirect = stripLocalePrefix(request);
  if (localeRedirect) return localeRedirect;

  // Rutas que NO son páginas traducidas: se dejan pasar sin reescribir.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    // Imágenes de metadata (opengraph-image, twitter-image, icon, apple-icon).
    // No llevan extensión en la URL (`/opengraph-image?<hash>`), así que el
    // check de estáticos de abajo no las pilla. Son assets públicos, NO páginas:
    // hay que servir el JPEG SIEMPRE, aunque la web esté cerrada y aunque la
    // petición de la imagen no traiga UA de bot — si no, el crawler la pide sin
    // UA social, el proxy la reescribe a /coming-soon y la preview sale sin foto.
    //
    // Se dejan pasar SIN reescribir porque viven fuera del árbol de idiomas
    // (ver app/opengraph-image.tsx). Reescribirlas no funcionaría igualmente:
    // Next resuelve las imágenes de metadata antes de aplicar los rewrites.
    /\/(opengraph-image|twitter-image|icon|apple-icon)$/.test(pathname) ||
    // archivos estáticos por extensión
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    const res = NextResponse.next();
    ensureLocaleCookie(request, res);
    return res;
  }

  // A partir de aquí es una página, y toda página se sirve en su idioma.
  const locale = localeOf(request);

  // ¿Pasa el muro? Suscriptor con acceso, web abierta, o bot de redes
  // sociales (que necesita ver el HTML real para que la preview al compartir
  // salga con su foto y no con el favicon).
  const pasa =
    request.cookies.get(ACCESS_COOKIE)?.value === "1" ||
    !isClosed() ||
    isSocialCrawler(request);

  // El muro también se sirve traducido, y como rewrite: la URL de la barra no
  // cambia. Antes se marcaba la request con una cabecera para que el layout
  // supiera que estaba pintando el muro y no montara el popup del 10% encima;
  // ya no hace falta, porque leer cabeceras volvería dinámica la página. Ahora
  // el propio ComingSoon monta lo suyo y el popup se controla por ruta.
  const res = pasa
    ? renderIn(request, locale)
    : renderIn(request, locale, "/coming-soon");
  ensureLocaleCookie(request, res);
  return res;
}

export const config = {
  matcher: [
    // Todo excepto API, _next y cualquier archivo con extensión.
    //
    // Antes solo se excluían `_next/static` y `_next/image`, así que CADA foto
    // y CADA vídeo de public/ (que en esta web son muchos) invocaba el proxy
    // para acabar cayendo en el allowlist de abajo y no hacer nada. Una función
    // por asset, y esta web sirve varias decenas por página. Excluirlos en el
    // matcher es gratis: no se ejecuta nada.
    //
    // La cookie de idioma no se pierde por esto: las páginas HTML no llevan
    // extensión, siguen pasando por el proxy y son las que la ponen. Los assets
    // se piden siempre DESPUÉS del HTML.
    "/((?!api|_next|.*\\.[a-z0-9]+$).*)",
  ],
};
