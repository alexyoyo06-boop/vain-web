import type { Metadata } from "next";
import { Archivo_Black, Inter, JetBrains_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartUIProvider } from "@/lib/cart-ui";
import { MenuUIProvider } from "@/lib/menu-ui";
import CartToast from "@/components/CartToast";
import NewsletterPopup from "@/components/NewsletterPopup";
import LocaleBanner from "@/components/LocaleBanner";
import RouteMemory from "@/components/RouteMemory";
import OnlineBeacon from "@/components/OnlineBeacon";
import { getT } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";
import {
  LOCALE_BANNER_DISMISS_COOKIE,
  localeDir,
  pickLocale,
  type Locale,
} from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

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

// El layout decide si mostrar el LocaleBanner según headers/cookies del
// request. Forzar dinámico para garantizar que se evalúa por request y no
// se cachea una versión sin/con banner para todos los visitantes.
export const dynamic = "force-dynamic";

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

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getT();
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
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.siteTitle,
      description: t.meta.ogDescription,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getT();

  // Sugerencia de idioma. Usa la MISMA detección que el proxy/getLocale
  // (idioma del dispositivo → país IP → inglés), así nunca se contradice
  // con lo que ya decidimos servir: solo aparece si el locale activo
  // (p.ej. elegido a mano hace meses, o cookie antigua) difiere de lo que
  // detectaríamos hoy para este dispositivo+ubicación.
  const [h, c] = await Promise.all([headers(), cookies()]);
  const dismissed =
    c.get(LOCALE_BANNER_DISMISS_COOKIE)?.value === "1";
  const suggested = pickLocale(
    h.get("accept-language"),
    h.get("x-vercel-ip-country"),
  );
  const showLocaleBanner = !dismissed && suggested !== locale;

  // Cuando la web está cerrada, el proxy hace rewrite al muro (/coming-soon)
  // manteniendo la URL, y marca la request con "x-vain-wall". En ese caso el
  // popup del 10% no debe montarse (el muro ya pide el email). El pathname en
  // cliente sigue siendo "/", así que este flag del server es la señal fiable.
  const servingWall = h.get("x-vain-wall") === "1";

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      data-scroll-behavior="smooth"
      className={`${archivoBlack.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body
        className={`min-h-full flex flex-col bg-bone text-ink selection:bg-ink/15 selection:text-ink ${
          showLocaleBanner ? "has-locale-banner" : ""
        }`}
      >
        <LocaleProvider locale={locale} dict={t}>
          <RouteMemory />
          {/* Latido de presencia: alimenta el contador de "gente online" del
              panel de admin. No pinta nada. */}
          <OnlineBeacon />
          {showLocaleBanner && <LocaleBanner suggestedLocale={suggested} />}
          <CartUIProvider>
            <MenuUIProvider>{children}</MenuUIProvider>
            <CartToast />
          </CartUIProvider>
          {/* Popup del 10%: se controla su visibilidad dentro (no sale en
              /coming-soon ni /admin, y solo una vez por visitante). No se monta
              cuando el proxy está sirviendo el muro de "web cerrada". */}
          {!servingWall && <NewsletterPopup />}
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
