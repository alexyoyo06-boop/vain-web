// Lee settings globales del sitio desde un Metaobject de Shopify.
// El amigo gestiona desde Shopify Admin → Contenido → Metaobjetos → Site Settings.
// Si el metaobject no existe (todavía no creado), fallback a env vars.

import "server-only";
import { storefront } from "./client";
import { GET_SITE_SETTINGS } from "./queries";

type MetaobjectField = { key: string; value: string };
type MetaobjectNode = { handle: string; fields: MetaobjectField[] };
type SettingsResp = {
  metaobjects: { edges: { node: MetaobjectNode }[] };
};

export type SiteSettings = {
  comingSoonMode: boolean;
  earlyAccessPassword: string;
  source: "shopify" | "env";
};

function parseBool(v: string | undefined): boolean | null {
  if (v == null) return null;
  const s = v.trim().toLowerCase();
  if (s === "true" || s === "on" || s === "1" || s === "yes") return true;
  if (s === "false" || s === "off" || s === "0" || s === "no") return false;
  return null;
}

/**
 * Lee settings. Prioridad:
 *   1) Metaobject "site_settings" en Shopify (gestionado por el amigo)
 *   2) Env vars EARLY_ACCESS_MODE / EARLY_ACCESS_PASSWORD (fallback)
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const envMode =
    (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";
  const envPassword = process.env.EARLY_ACCESS_PASSWORD ?? "";

  const data = await storefront<SettingsResp>(
    GET_SITE_SETTINGS,
    {},
    {
      tags: ["shopify", "shopify:site-settings"],
      revalidate: 30,
    },
  );

  const node = data?.metaobjects.edges[0]?.node;
  if (!node) {
    return {
      comingSoonMode: envMode,
      earlyAccessPassword: envPassword,
      source: "env",
    };
  }

  const fields: Record<string, string> = {};
  for (const f of node.fields) fields[f.key] = f.value;

  // Aceptamos varios nombres de campo por flexibilidad
  const modeRaw =
    fields.coming_soon_mode ??
    fields.coming_soon ??
    fields.mode ??
    undefined;
  const passwordRaw =
    fields.early_access_password ??
    fields.password ??
    fields.access_password ??
    undefined;

  const parsedMode = parseBool(modeRaw);
  return {
    comingSoonMode: parsedMode ?? envMode,
    earlyAccessPassword:
      (passwordRaw ?? "").trim() || envPassword,
    source: "shopify",
  };
}

export function isValidPassword(input: string, expected: string): boolean {
  if (!expected) return false;
  return input.trim().toLowerCase() === expected.toLowerCase();
}
