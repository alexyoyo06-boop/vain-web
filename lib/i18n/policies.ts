// Diccionario de las páginas legales. Va SEPARADO de messages/*.json a
// propósito: son ~500 líneas de texto por idioma y messages/ entero viaja al
// cliente por el LocaleProvider. Estas páginas son server components, así que
// solo se carga el idioma que se está pintando.

import "server-only";
import type { Locale } from "./config";

/** Bloque de contenido de una página legal. Exactamente una clave por bloque. */
export type PolicyBlock =
  | { h2: string }
  | { h3: string }
  | { p: string }
  | { note: string }
  | { ul: string[] };

export type PolicyPageCopy = {
  /** <title> de la pestaña. Sin el sufijo "— VAIN", se añade solo. */
  title: string;
  /** <h1> de la página. Suele coincidir con `title`. */
  heading: string;
  blocks: PolicyBlock[];
};

/** Claves = carpeta de la ruta bajo /policies. */
export type PolicyKey =
  | "privacy-policy"
  | "shipping-policy"
  | "refund-policy"
  | "terms-of-service"
  | "legal-notice"
  | "contact-information"
  | "withdrawal";

export type PolicyDictionary = Record<PolicyKey, PolicyPageCopy>;

const loaders: Record<Locale, () => Promise<PolicyDictionary>> = {
  es: () => import("@/messages/policies/es.json").then((m) => m.default as PolicyDictionary),
  en: () => import("@/messages/policies/en.json").then((m) => m.default as PolicyDictionary),
  fr: () => import("@/messages/policies/fr.json").then((m) => m.default as PolicyDictionary),
  it: () => import("@/messages/policies/it.json").then((m) => m.default as PolicyDictionary),
  de: () => import("@/messages/policies/de.json").then((m) => m.default as PolicyDictionary),
  pt: () => import("@/messages/policies/pt.json").then((m) => m.default as PolicyDictionary),
  nl: () => import("@/messages/policies/nl.json").then((m) => m.default as PolicyDictionary),
  pl: () => import("@/messages/policies/pl.json").then((m) => m.default as PolicyDictionary),
  el: () => import("@/messages/policies/el.json").then((m) => m.default as PolicyDictionary),
  ru: () => import("@/messages/policies/ru.json").then((m) => m.default as PolicyDictionary),
  ar: () => import("@/messages/policies/ar.json").then((m) => m.default as PolicyDictionary),
};

export async function getPolicyCopy(
  locale: Locale,
  key: PolicyKey,
): Promise<PolicyPageCopy> {
  return (await loaders[locale]())[key];
}
