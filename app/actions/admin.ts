"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_HINT_COOKIE,
  getAdminPassword,
  isAdmin,
  mintAdminToken,
} from "@/lib/admin-auth";
import { EARLY_ACCESS_COOKIE } from "@/lib/early-access";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { setEarlyAccessPassword } from "@/lib/site-state";

export type AdminLoginState = { error: string } | null;

// 5 intentos por IP cada 15 minutos. Pensado para frenar brute force a la
// pass de 6 dígitos (1M combinaciones). Con este límite, romperla a fuerza
// bruta exige >5.5 años desde una IP fija.
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Comparación en tiempo constante. Hasheamos ambos lados con SHA-256 antes de
// comparar para que los buffers tengan siempre la misma longitud (si no,
// timingSafeEqual lanza y la longitud de la pass se filtraría por timing).
function timingSafeEqualStr(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function adminLoginAction(
  _prev: AdminLoginState,
  fd: FormData,
): Promise<AdminLoginState> {
  const ip = await getClientIp();
  const rl = checkRateLimit(
    `admin-login:${ip}`,
    ADMIN_LOGIN_MAX_ATTEMPTS,
    ADMIN_LOGIN_WINDOW_MS,
  );
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return {
      error: `Demasiados intentos. Vuelve a probar en ${mins} min.`,
    };
  }

  const password = String(fd.get("password") ?? "").trim();
  const expected = getAdminPassword().trim();
  if (!expected) {
    return {
      error:
        "Falta configurar ADMIN_PASSWORD en el servidor. Avísame y lo ponemos.",
    };
  }
  if (!timingSafeEqualStr(password, expected)) {
    return { error: "Contraseña incorrecta." };
  }
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, mintAdminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // 24h. Antes 30 días — reducido para minimizar riesgo si el dispositivo
    // queda desatendido. El admin tendrá que re-loguearse una vez al día.
    maxAge: 60 * 60 * 24,
  });
  // Gemela visible para el JS: solo sirve para que el menú pinte el botón de
  // Admin sin que el servidor tenga que leer cookies al montar cada página.
  // Ver ADMIN_HINT_COOKIE en lib/admin-auth.ts.
  jar.set(ADMIN_HINT_COOKIE, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  redirect("/admin");
}

export async function adminLogoutAction() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(ADMIN_HINT_COOKIE);
  redirect("/admin/login");
}

/**
 * Previsualizar la web desde el panel admin. Setea la cookie de early
 * access (igual que un suscriptor que canjea la pass) y redirige a /.
 * Sirve tanto si la web está abierta como cerrada — en abierta no cambia
 * nada, en cerrada permite al admin verla sin teclear la pass.
 */
export async function previewSiteAction() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }
  const jar = await cookies();
  jar.set(EARLY_ACCESS_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export type AdminActionState = {
  ok: boolean;
  message: string;
} | null;

// El botón de abrir/cerrar la web se quitó del panel (6 ago 2026): preguntar
// el flag por visita agotaba la cuota gratis de Edge Config y Vercel pausa el
// proyecto al pasarse. Ahora se hace con la env var EARLY_ACCESS_MODE.

export async function setEarlyAccessPasswordAction(
  _prev: AdminActionState,
  fd: FormData,
): Promise<AdminActionState> {
  if (!(await isAdmin())) {
    return { ok: false, message: "No autorizado." };
  }
  const password = String(fd.get("password") ?? "").trim();
  if (!password) {
    return { ok: false, message: "Password vacía." };
  }
  const result = await setEarlyAccessPassword(password);
  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  return { ok: true, message: "Password actualizada." };
}
