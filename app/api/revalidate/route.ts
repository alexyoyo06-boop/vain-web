// Webhook endpoint para revalidar caché cuando Shopify cambia algo.
// Se llama desde: Shopify Admin → Configuración → Notificaciones → Webhooks.
//
// Verifica HMAC SHA256 con SHOPIFY_WEBHOOK_SECRET antes de revalidar,
// para que nadie de fuera pueda invalidar nuestra caché spammeando esta URL.
//
// Eventos recomendados a configurar en Shopify:
//   - products/create
//   - products/update
//   - products/delete
//   - inventory_levels/update
//   - inventory_items/update
//
// URL de destino: https://<tu-dominio>/api/revalidate

import { revalidateTag } from "next/cache";
import crypto from "node:crypto";

const SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? "";

function verifyHmac(rawBody: string, header: string | null): boolean {
  if (!SECRET || !header) return false;
  const digest = crypto
    .createHmac("sha256", SECRET)
    .update(rawBody, "utf8")
    .digest("base64");
  // timingSafeEqual requiere buffers de igual longitud
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const raw = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!verifyHmac(raw, hmacHeader)) {
    return new Response("invalid signature", { status: 401 });
  }

  const topic = req.headers.get("x-shopify-topic") ?? "";
  // Toda revalidación toca el tag genérico "shopify". Si es un producto en
  // concreto, invalidamos también su tag específico para que la ficha se
  // refresque en el siguiente render.
  revalidateTag("shopify", "max");

  if (topic.startsWith("products/")) {
    revalidateTag("shopify:products", "max");
    try {
      const data = JSON.parse(raw) as { handle?: string };
      if (data.handle) {
        revalidateTag(`shopify:product:${data.handle}`, "max");
      }
    } catch {
      // raw not JSON — ignore, ya invalidamos el tag general
    }
  }

  return Response.json({ ok: true, topic });
}
