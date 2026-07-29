// Webhook de pedidos: alimenta el globo del panel /admin.
//
// Se configura en: Shopify Admin → Ajustes → Notificaciones → Webhooks →
//   evento "Creación de pedido", formato JSON,
//   URL https://www.v4in.com/api/orders
//
// No hace falta ni Admin API ni custom app: los webhooks del admin firman con
// el secreto de webhooks de la tienda, el mismo que ya usa /api/revalidate.
//
// De cada pedido se queda con el país y una coordenada redondeada. Nada de
// nombre, email, dirección ni importe — ver lib/orders-geo.ts.

import { verifyShopifyWebhook } from "@/lib/shopify/webhook";
import { saveOrderPing } from "@/lib/orders-geo";

/** Lo poco que nos interesa del payload de Shopify. */
type ShopifyOrder = {
  id?: number | string;
  shipping_address?: {
    country_code?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  billing_address?: {
    country_code?: string | null;
  } | null;
};

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verifyShopifyWebhook(raw, req.headers.get("x-shopify-hmac-sha256"))) {
    return new Response("invalid signature", { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "";
  if (topic !== "orders/create") {
    // Firma buena pero evento que no nos toca: 200 para que Shopify no lo
    // marque como fallido ni se ponga a reintentar.
    return Response.json({ ok: true, ignored: topic });
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(raw) as ShopifyOrder;
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  const ship = order.shipping_address;
  // Un pedido digital o sin dirección de envío todavía tiene facturación.
  const country = ship?.country_code ?? order.billing_address?.country_code;

  // Idempotencia: Shopify reintenta hasta 48 h. El id del pedido nombra el
  // blob, así que el reintento se pisa a sí mismo en vez de duplicar el punto.
  const id = String(
    order.id ?? req.headers.get("x-shopify-webhook-id") ?? Date.now(),
  );

  const saved = await saveOrderPing({
    id,
    country,
    city: ship?.city,
    lat: ship?.latitude,
    lng: ship?.longitude,
  });

  return Response.json({ ok: true, saved });
}
