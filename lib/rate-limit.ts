// Rate limiter in-memory para Server Actions. No usa servicios externos.
//
// Limitaciones de serverless: cada instancia de función tiene su propio Map.
// Si el atacante consigue golpear instancias distintas en paralelo puede
// duplicar el límite efectivo. Aceptable: filtra el 99% de scripts amateur
// (que martillean desde una sola IP) y eleva el coste de ataque sin meter
// dependencias externas. Para producción a gran escala, migrar a Vercel KV.

import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Cleanup oportunista: cada N hits, purgar entradas vencidas. Evita fuga
// de memoria si entran muchas IPs distintas (DoS de relleno del Map).
let hitsSinceCleanup = 0;
const CLEANUP_EVERY = 500;

function maybeCleanup(now: number) {
  hitsSinceCleanup++;
  if (hitsSinceCleanup < CLEANUP_EVERY) return;
  hitsSinceCleanup = 0;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export async function getClientIp(): Promise<string> {
  const h = await headers();

  // Vercel rellena este header con la IP real del cliente en el edge y el
  // cliente NO lo puede falsear (lo pone la plataforma). Es la fuente de
  // confianza. OJO: NO usar el primer valor de x-forwarded-for — ese lo
  // controla quien hace la petición, así que un atacante rotándolo se
  // saltaría el límite por IP (cada intento parecería una IP nueva).
  const vercel = h.get("x-vercel-forwarded-for");
  if (vercel) {
    const ip = vercel.split(",")[0]?.trim();
    if (ip) return ip;
  }

  // x-real-ip también lo fija Vercel a la IP del cliente.
  const real = h.get("x-real-ip");
  if (real) return real.trim();

  // Fallback: el ÚLTIMO valor de x-forwarded-for es el que añade el último
  // proxy de confianza (no el que inyecta el cliente por la izquierda).
  const fwd = h.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  return "local";
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * Permite hasta `max` hits por `windowMs` agrupados bajo la misma `key`.
 * La key debería incluir tanto el nombre de la acción como la IP
 * (p.ej. "admin-login:1.2.3.4") para que distintos endpoints no se
 * canibalicen su presupuesto.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count++;
  return { ok: true, remaining: max - bucket.count };
}
