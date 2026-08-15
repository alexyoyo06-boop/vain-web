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

/**
 * Cada cuánto se dan por caducados los datos de Shopify, y con ellos las
 * páginas que los usan.
 *
 * ESTE NÚMERO ES EL PRECIO DE LA WEB EN CPU. Una página pre-generada se vuelve
 * a montar la primera vez que alguien la pide después de que caduque, y montar
 * cuesta CPU, que es la cuota que puede pausar el proyecto. Con 11 idiomas hay
 * ~133 variantes de página, así que el coste diario es "variantes con tráfico ×
 * (86400 / este número)". Estaba en 60 segundos: con tráfico continuo eso son
 * decenas de miles de renders al día y no cabe en las 4 h/mes del plan gratis.
 *
 * Que sea una hora NO significa que un producto agotado tarde una hora en
 * reflejarse: los webhooks de Shopify (products/*, inventory_levels/update →
 * /api/revalidate) invalidan al instante. Esto es solo la red de seguridad por
 * si el webhook no está puesto o falla, y una hora de desfase no vende de más
 * — el checkout de Shopify comprueba el stock de verdad al pagar.
 */
const DEFAULT_REVALIDATE_S = 3600;

export type StorefrontFetchOptions = {
  /** Cache tags para revalidateTag(). Default ["shopify"]. */
  tags?: string[];
  /** Segundos de revalidación. 0 = no cachear (carrito). */
  revalidate?: number;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string; locations?: unknown; path?: string[] }[];
};

/**
 * "No he podido hablar con Shopify" — distinto de "Shopify dice que no hay
 * productos".
 *
 * ESTO SE LANZA A PROPÓSITO EN VEZ DE DEVOLVER null, Y ES IMPORTANTE. Antes un
 * fallo de red o un 401 devolvían null, `fetchAllProducts()` lo convertía en
 * `[]`, y la página se regeneraba "con éxito" pero SIN PRODUCTOS. Como las
 * páginas se cachean, esa versión vacía se quedaba servida durante una hora:
 * un parpadeo de Shopify, o un token rotado, dejaban la tienda con los huecos
 * de "Pronto." sin que nadie se enterara. Con el token caducado, para siempre.
 *
 * Lanzando, Next aborta la regeneración y SIGUE SIRVIENDO LA ÚLTIMA VERSIÓN
 * BUENA, y lo reintenta en la siguiente visita. Si pasa durante un despliegue,
 * el build falla y se queda en producción el despliegue anterior — que también
 * es lo que se quiere: mejor no desplegar que desplegar una tienda vacía.
 *
 * Quien SÍ tiene que tragarse el error es lo que atiende a una persona en
 * directo (añadir al carrito, suscribirse): ahí se captura y se responde con un
 * mensaje, no con una pantalla rota.
 */
export class ShopifyUnavailableError extends Error {
  constructor(detalle: string) {
    super(`Shopify no disponible: ${detalle}`);
    this.name = "ShopifyUnavailableError";
  }
}

export async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { tags = ["shopify"], revalidate = DEFAULT_REVALIDATE_S }: StorefrontFetchOptions = {},
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
      throw new ShopifyUnavailableError(`${res.status} ${res.statusText}`);
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
      throw new ShopifyUnavailableError(
        `GraphQL sin datos: ${json.errors.map((e) => e.message).join(", ")}`,
      );
    }

    return json.data ?? null;
  } catch (err) {
    if (err instanceof ShopifyUnavailableError) throw err;
    console.error("[shopify] fetch failed:", err);
    throw new ShopifyUnavailableError(String(err));
  }
}
