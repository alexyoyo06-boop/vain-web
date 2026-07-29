import "server-only";
import crypto from "node:crypto";

/**
 * Firma de los webhooks de Shopify.
 *
 * Shopify firma el cuerpo crudo con HMAC-SHA256 y lo manda en base64 en la
 * cabecera `x-shopify-hmac-sha256`. Sin comprobarlo, cualquiera que sepa la URL
 * podría inventarse pedidos o tirarnos la caché a base de POSTs.
 *
 * El secreto es UNO por tienda para todos los webhooks creados desde el admin
 * (Ajustes → Notificaciones), así que `/api/revalidate` y `/api/orders`
 * comparten `SHOPIFY_WEBHOOK_SECRET`.
 */
export function verifyShopifyWebhook(
  rawBody: string,
  hmacHeader: string | null,
): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";
  if (!secret || !hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  // timingSafeEqual exige buffers de igual longitud: si no lo son, la firma
  // ya es inválida de todas formas.
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
