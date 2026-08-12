// Cliente bajo nivel de la Storefront API de Shopify. SOLO server-side.
// Prefiere el private token si está (rate limit mejor + más seguro);
// cae al public token si no. Si no hay ningún token, devuelve null
// silenciosamente para que la web no crashee.

import "server-only";

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? "";
const PRIVATE_TOKEN = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN ?? "";
const PUBLIC_TOKEN = process.env.SHOPIFY_STOREFRONT_PUBLIC_TOKEN ?? "";
const VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-01";

const TOKEN = PRIVATE_TOKEN || PUBLIC_TOKEN;
const USE_PRIVATE = Boolean(PRIVATE_TOKEN);

export const SHOPIFY_CONFIGURED = Boolean(DOMAIN && TOKEN);

const ENDPOINT = SHOPIFY_CONFIGURED
  ? `https://${DOMAIN}/api/${VERSION}/graphql.json`
  : "";

export type StorefrontFetchOptions = {
  /** Cache tags para revalidateTag(). Default ["shopify"]. */
  tags?: string[];
  /** Segundos de revalidación. 0 = no cachear (carrito). Default 60. */
  revalidate?: number;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; locations?: unknown; path?: string[] }[];
};

export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { tags = ["shopify"], revalidate = 60 }: StorefrontFetchOptions = {},
): Promise<T | null> {
  if (!SHOPIFY_CONFIGURED) return null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (USE_PRIVATE) {
    headers["Shopify-Storefront-Private-Token"] = TOKEN;
  } else {
    headers["X-Shopify-Storefront-Access-Token"] = TOKEN;
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
      next:
        revalidate === 0
          ? { revalidate: 0 }
          : { revalidate, tags },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[shopify] ${res.status} ${res.statusText} — ${body.slice(0, 200)}`,
      );
      return null;
    }

    const json: GraphQLResponse<T> = await res.json();

    if (json.errors?.length) {
      console.error(
        `[shopify] GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`,
      );
      // OJO: se devuelven los datos IGUALMENTE si vienen.
      //
      // En GraphQL un error no es todo o nada: si falla un campo suelto — por
      // ejemplo `quantityAvailable`, que necesita un permiso extra en Shopify —
      // la respuesta trae el resto del producto con ese campo a null y el error
      // aparte. Devolver null aquí tiraba el CATÁLOGO ENTERO por un campo
      // secundario, y la web se quedaba sin productos.
      //
      // Solo se da por perdida la petición cuando no hay datos que rescatar.
      if (json.data) return json.data;
      return null;
    }

    return json.data ?? null;
  } catch (err) {
    console.error("[shopify] fetch failed:", err);
    return null;
  }
}
