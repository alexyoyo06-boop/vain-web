// Auth para el panel /admin. Independiente del login de cliente de Shopify.
// Se usa una sola password compartida (env var ADMIN_PASSWORD). Tras validarla
// se guarda una cookie httpOnly cuyo valor es un TOKEN FIRMADO (HMAC), no un
// "1" pelado: así la cookie no se puede fabricar a mano. httpOnly impide que
// el JS del cliente la lea, pero NO impide que un atacante la envíe él mismo
// (curl, etc.) — por eso el valor tiene que ser imposible de adivinar.

import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "vain_admin";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword());
}

// Secreto con el que se firma la cookie de sesión. Si no hay uno dedicado
// (ADMIN_SESSION_SECRET), se deriva del ADMIN_PASSWORD — así sigue funcionando
// sin tener que añadir env vars, y cambiar la password invalida las sesiones.
function sessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

// Token de sesión = HMAC-SHA256(secreto, etiqueta fija). Valor estable pero
// imposible de reproducir sin conocer el secreto del servidor.
export function mintAdminToken(): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update("admin-session-v1")
    .digest("hex");
}

export async function isAdmin(): Promise<boolean> {
  // Sin secreto configurado, fail closed (no se puede validar nada).
  if (!sessionSecret()) return false;

  const jar = await cookies();
  const value = jar.get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  // Comparación en tiempo constante. Ambos son hex de 64 chars; el check de
  // longitud evita que timingSafeEqual lance con buffers desiguales.
  const a = Buffer.from(value);
  const b = Buffer.from(mintAdminToken());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
