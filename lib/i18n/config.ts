// Configuración global de idiomas. Mantener corto: solo añadir locales
// cuando haya traducciones completas.

export const LOCALES = [
  "es", "en", "fr", "it", "de", "pt", "nl", "pl", "el", "ru", "ar",
] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

/** Idiomas que se escriben de derecha a izquierda. */
export const RTL_LOCALES = new Set<Locale>(["ar"]);
export function localeDir(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export const LOCALE_COOKIE = "vain_locale";
/** Cookie de dismiss del banner de sugerencia de idioma. Una vez seteada, no
 *  se vuelve a mostrar el banner ni aunque el usuario cambie de IP. */
export const LOCALE_BANNER_DISMISS_COOKIE = "vain_locale_banner_dismissed";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Etiquetas cortas mostradas en el switcher. */
export const LOCALE_LABEL: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  it: "IT",
  de: "DE",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  el: "EL",
  ru: "RU",
  ar: "AR",
};

/** Nombre nativo de cada idioma — para el banner de sugerencia y el menú. */
export const LOCALE_NATIVE_NAME: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  it: "Italiano",
  de: "Deutsch",
  pt: "Português",
  nl: "Nederlands",
  pl: "Polski",
  el: "Ελληνικά",
  ru: "Русский",
  ar: "العربية",
};

/** Código de idioma Shopify @inContext correspondiente (LanguageCode enum). */
export const LOCALE_TO_SHOPIFY: Record<Locale, string> = {
  es: "ES",
  en: "EN",
  fr: "FR",
  it: "IT",
  de: "DE",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  el: "EL",
  ru: "RU",
  ar: "AR",
};

/** Países (ISO 3166-1 alfa-2) que deben servir ES por defecto. */
export const SPANISH_COUNTRIES = new Set([
  "ES", // España
  "MX", // México
  "AR", // Argentina
  "CO", // Colombia
  "CL", // Chile
  "PE", // Perú
  "VE", // Venezuela
  "UY", // Uruguay
  "PY", // Paraguay
  "BO", // Bolivia
  "EC", // Ecuador
  "GT", // Guatemala
  "CR", // Costa Rica
  "PA", // Panamá
  "DO", // República Dominicana
  "HN", // Honduras
  "NI", // Nicaragua
  "SV", // El Salvador
  "CU", // Cuba
  "PR", // Puerto Rico
]);

/** Resto de países → idioma. Lo no listado (ni hispano) cae a EN. */
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Francés
  FR: "fr", // Francia
  MC: "fr", // Mónaco
  // Italiano
  IT: "it", // Italia
  SM: "it", // San Marino
  VA: "it", // Vaticano
  // Alemán
  DE: "de", // Alemania
  AT: "de", // Austria
  CH: "de", // Suiza (mayoría germanófona)
  LI: "de", // Liechtenstein
  // Portugués
  PT: "pt", // Portugal
  BR: "pt", // Brasil
  AO: "pt", // Angola
  MZ: "pt", // Mozambique
  CV: "pt", // Cabo Verde
  // Neerlandés
  NL: "nl", // Países Bajos
  BE: "nl", // Bélgica (mayoría flamenca)
  SR: "nl", // Surinam
  // Polaco
  PL: "pl", // Polonia
  // Griego
  GR: "el", // Grecia
  CY: "el", // Chipre
  // Ruso
  RU: "ru", // Rusia
  BY: "ru", // Bielorrusia
  KZ: "ru", // Kazajistán
  KG: "ru", // Kirguistán
  // Árabe
  SA: "ar", AE: "ar", EG: "ar", MA: "ar", DZ: "ar", TN: "ar",
  LY: "ar", JO: "ar", IQ: "ar", KW: "ar", QA: "ar", BH: "ar",
  OM: "ar", YE: "ar", SY: "ar", LB: "ar", PS: "ar", SD: "ar",
};

export function localeFromCountry(country: string | null | undefined): Locale {
  if (!country) return "en";
  const c = country.toUpperCase();
  if (SPANISH_COUNTRIES.has(c)) return "es";
  return COUNTRY_TO_LOCALE[c] ?? "en";
}

/**
 * Parsea el header Accept-Language COMPLETO (todos los idiomas del
 * dispositivo, ordenados por q-value) y devuelve el primero soportado.
 * Así un móvil en "ca-ES, es;q=0.9" cae a español aunque su idioma
 * principal (catalán) no esté en la lista.
 */
export function localeFromAcceptLanguage(
  header: string | null | undefined,
): Locale | null {
  if (!header) return null;
  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qRaw = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const q = qRaw === undefined ? 1 : Number.parseFloat(qRaw);
      return {
        lang: tag?.trim().toLowerCase().split("-")[0] ?? "",
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((c) => c.lang && c.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const c of candidates) {
    if (isLocale(c.lang)) return c.lang;
  }
  return null;
}

/**
 * Detección unificada de idioma — ÚNICA fuente de verdad (la usan el proxy,
 * getLocale() y el banner de sugerencia, así nunca se contradicen):
 *   1. Idioma del dispositivo (Accept-Language, todos los candidatos): es la
 *      señal explícita del usuario. Un español viviendo en Berlín sigue
 *      queriendo la web en español.
 *   2. País de la IP: para navegadores sin Accept-Language útil.
 *   3. Nada encaja → inglés.
 */
export function pickLocale(
  acceptLanguage: string | null | undefined,
  country: string | null | undefined,
): Locale {
  return localeFromAcceptLanguage(acceptLanguage) ?? localeFromCountry(country);
}
