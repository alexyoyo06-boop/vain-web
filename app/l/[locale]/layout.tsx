import type { Metadata } from "next";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartUIProvider } from "@/lib/cart-ui";
import { MenuUIProvider } from "@/lib/menu-ui";
import CartToast from "@/components/CartToast";
import NewsletterPopup from "@/components/NewsletterPopup";
import LocaleBanner from "@/components/LocaleBanner";
import RouteMemory from "@/components/RouteMemory";
import ResourceHints from "@/components/ResourceHints";
import OnlineBeacon from "@/components/OnlineBeacon";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LocaleProvider } from "@/lib/i18n/client";
import { LOCALES, localeDir, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import { OG_IMAGE } from "@/lib/og-image";
import "../../globals.css";
import { localeParam } from "@/lib/i18n/params";

/**
 * LAYOUT RAÍZ. Vive bajo `app/l/[locale]/` y no en `app/`, y ese es el cambio
 * más importante de toda la web.
 *
 * EL PROBLEMA QUE RESUELVE: el idioma vivía en una cookie, y leer una cookie
 * obliga a Next a montar la página ENTERA en el servidor para cada visitante —
 * no puede reutilizar nada. Con 11 idiomas y una tienda que vende por TikTok,
 * eso significa que el gasto de CPU crecía con el tráfico: el día que un vídeo
 * funciona, se agota la cuota y Vercel PAUSA el proyecto (la tienda se cae).
 * Pasó de verdad: 14 minutos de CPU al día, 86% de la cuota mensual.
 *
 * LA SOLUCIÓN: el idioma pasa a ser un segmento de la URL INTERNA. Con eso Next
 * puede pre-generar las 11 copias de cada página en el despliegue y servirlas
 * ya hechas, sin CPU por visita.
 *
 * POR QUÉ `/l/` Y NO `/es/` DIRECTAMENTE: las URLs públicas no cambian. El
 * proxy reescribe `/todo` → `/l/es/todo` por dentro, y el visitante sigue
 * viendo `v4in.com/todo`. El prefijo `/l/` hace falta porque `/es/...` ya
 * significa otra cosa: el proxy lo redirige quitando el prefijo (los enlaces
 * que genera el checkout de Shopify vienen así). Una sola letra que no puede
 * confundirse con un idioma evita ese choque.
 *
 * LO QUE YA NO PUEDE HACER ESTE LAYOUT: llamar a cookies() o headers(). Si lo
 * hiciera, volveríamos al render por visita y todo esto no habría servido de
 * nada. Lo que dependía de la request se ha movido:
 *   · el idioma → viene en `params`;
 *   · la sugerencia de idioma del LocaleBanner → la decide el navegador;
 *   · el muro de "web cerrada" → se detecta por la ruta, no por una cabecera.
 */

const archivoBlack = Archivo_Black({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

/**
 * Las 11 copias que se generan en el despliegue. Sin esto no habría nada
 * pre-hecho y cada visita volvería a costar CPU.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

// SIN `dynamicParams = false` a propósito. Tentaba ponerlo (un idioma
// inventado debe ser 404) pero la opción se hereda a TODAS las rutas hijas, y
// ahí hace daño: un producto que se suba a Shopify después del último
// despliegue no está en `generateStaticParams`, y con esto daría 404 hasta
// volver a desplegar. Sin ello, esa ficha se monta la primera vez que alguien
// entra y queda cacheada — que es justo lo que se quiere.
//
// El idioma inventado lo corta igualmente `localeParam()`, que hace notFound().

// og:locale espera formato idioma_TERRITORIO; cubrimos los 11 idiomas.
const OG_LOCALE: Record<Locale, string> = {
  es: "es_ES",
  en: "en_US",
  fr: "fr_FR",
  it: "it_IT",
  de: "de_DE",
  pt: "pt_PT",
  nl: "nl_NL",
  pl: "pl_PL",
  el: "el_GR",
  ru: "ru_RU",
  ar: "ar_SA",
};

type LayoutParams = { params: Promise<{ locale: string }> };

/** El idioma del segmento, validado. */
async function localeFrom(params: LayoutParams["params"]): Promise<Locale> {
  return localeParam((await params).locale);
}

export async function generateMetadata({
  params,
}: LayoutParams): Promise<Metadata> {
  const locale = await localeFrom(params);
  const t = await getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t.meta.siteTitle,
      template: "%s",
    },
    description: t.meta.siteDescription,
    openGraph: {
      type: "website",
      siteName: "VAIN",
      locale: OG_LOCALE[locale],
      title: t.meta.siteTitle,
      description: t.meta.ogDescription,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.siteTitle,
      description: t.meta.ogDescription,
      images: [OG_IMAGE],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutParams & { children: React.ReactNode }) {
  const locale = await localeFrom(params);
  const t = await getDictionary(locale);

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      data-scroll-behavior="smooth"
      className={`${archivoBlack.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bone text-ink selection:bg-ink/15 selection:text-ink">
        <LocaleProvider locale={locale} dict={t}>
          {/* Abre la conexión con el CDN de Shopify (vídeo del banner y fotos
              de producto) antes de que se necesite. No pinta nada. */}
          <ResourceHints />
          <RouteMemory />
          {/* Latido de presencia: alimenta el contador de "gente online" del
              panel de admin. No pinta nada. */}
          <OnlineBeacon />
          {/* Sugerencia de idioma. Antes se decidía en el servidor comparando
              el idioma del dispositivo con el activo, y para eso hacía falta
              leer cabeceras — justo lo que ya no se puede hacer aquí. Ahora lo
              decide el propio navegador, que sabe su idioma sin preguntar a
              nadie. */}
          <LocaleBanner activeLocale={locale} />
          <CartUIProvider>
            <MenuUIProvider>{children}</MenuUIProvider>
            <CartToast />
          </CartUIProvider>
          {/* Popup del 10%: se controla su visibilidad dentro (no sale en
              /coming-soon ni /admin, y solo una vez por visitante). */}
          <NewsletterPopup />
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
