// Cliente bajo nivel de la Admin API de Shopify. SOLO server-side.
// Distinto del Storefront: la Admin API permite escribir metaobjetos,
// productos, descuentos, etc. Necesita un token de app personalizada
// con scope `write_metaobjects` (y `read_metaobjects`).

import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN ?? "";
const VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

export const SHOPIFY_ADMIN_CONFIGURED = Boolean(DOMAIN && ADMIN_TOKEN);

const ENDPOINT = SHOPIFY_ADMIN_CONFIGURED
  ? `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`
  : "";

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; locations?: unknown; path?: string[] }[];
};

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function shopifyAdmin<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<AdminResult<T>> {
  if (!SHOPIFY_ADMIN_CONFIGURED) {
    return {
      ok: false,
      error:
        "Admin API no configurada. Añade SHOPIFY_ADMIN_API_TOKEN al entorno.",
    };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Shopify Admin ${res.status}: ${body.slice(0, 200)}`,
      };
    }

    const json: GraphQLResponse<T> = await res.json();
    if (json.errors?.length) {
      return {
        ok: false,
        error: json.errors.map((e) => e.message).join(", "),
      };
    }
    if (!json.data) return { ok: false, error: "Respuesta vacía." };
    return { ok: true, data: json.data };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Error desconocido en Admin API.",
    };
  }
}
