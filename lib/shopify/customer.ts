// Suscripción de email + teléfono via Storefront API customerCreate.
// El cliente queda como Customer en Shopify con acceptsMarketing=true,
// así aparece automáticamente en la lista de Marketing del amigo.

import "server-only";
import { randomBytes } from "node:crypto";
import { storefront } from "./client";
import { CUSTOMER_CREATE } from "./queries";

type CustomerCreateInput = {
  email: string;
  phone?: string;
  password: string;
  acceptsMarketing: boolean;
};

type CustomerCreateResp = {
  customerCreate: {
    customer: { id: string; email: string; phone: string | null } | null;
    customerUserErrors: { code?: string; field?: string[]; message: string }[];
  };
};

export type SubscribeResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Crea un Customer en Shopify para el signup de early access / newsletter.
 * Marca acceptsMarketing=true (queda como "Suscrito"). NO pone nombre: así en
 * la lista de clientes se ve el EMAIL real, no un genérico "Early Access".
 * El etiquetado "Early Access" se hace con un workflow de Shopify Flow
 * (la Storefront API no permite tags en customerCreate).
 */
export async function subscribeCustomer(opts: {
  email: string;
  phone?: string;
  smsConsent?: boolean;
}): Promise<SubscribeResult> {
  const { email, phone, smsConsent } = opts;

  // Storefront API requiere password (mín. 5, MAX 40 chars). Generamos uno
  // random de 32 chars hex. El cliente nunca lo usa: el login pasa por
  // Shopify Customer Accounts (account.v4in.com), no por nuestro form.
  const password = randomBytes(16).toString("hex");

  const input: CustomerCreateInput = {
    email,
    password,
    acceptsMarketing: true,
  };
  // Solo incluir phone si el cliente lo da y consintió SMS marketing
  if (phone && smsConsent) {
    input.phone = phone;
  }

  // Detrás de esto hay alguien esperando a que le digan si se ha suscrito, así
  // que un fallo de Shopify se convierte en un mensaje, no en una pantalla
  // rota. (Al pintar páginas es al revés: allí el error se propaga para no
  // cachear una tienda vacía — ver ShopifyUnavailableError en client.ts.)
  let data: CustomerCreateResp | null;
  try {
    data = await storefront<CustomerCreateResp>(
      CUSTOMER_CREATE,
      { input },
      { revalidate: 0, tags: ["shopify:customer-create"] },
    );
  } catch {
    return { ok: false, error: "No se pudo conectar con Shopify." };
  }

  if (!data) {
    return { ok: false, error: "No se pudo conectar con Shopify." };
  }
  const errors = data.customerCreate.customerUserErrors;
  if (errors.length > 0) {
    const err = errors[0];
    // Customer ya existe — lo tratamos como éxito silencioso (no spamear)
    if (err.code === "CUSTOMER_DISABLED" || err.code === "TAKEN") {
      return { ok: true };
    }
    return { ok: false, error: err.message };
  }
  return { ok: true };
}
