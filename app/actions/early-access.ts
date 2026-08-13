"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { subscribeCustomer } from "@/lib/shopify/customer";
import { EARLY_ACCESS_COOKIE } from "@/lib/early-access";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getRequestT } from "@/lib/i18n/server";
import { tpl } from "@/lib/i18n/dictionary";
import {
  getSiteState,
  isValidEarlyAccessPassword,
} from "@/lib/site-state";

export type SubscribeFormState = {
  ok: boolean;
  message: string;
} | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Suscripciones: 5 por IP cada 15 min. Suficiente para una familia
// compartiendo WiFi, frena el spam de altas de Customer en Shopify.
const SUBSCRIBE_MAX_ATTEMPTS = 5;
const SUBSCRIBE_WINDOW_MS = 15 * 60 * 1000;

// Password de early access: 10 intentos por IP cada 15 min. Frena fuerza
// bruta sin fastidiar a un suscriptor que la teclea mal un par de veces.
const UNLOCK_MAX_ATTEMPTS = 10;
const UNLOCK_WINDOW_MS = 15 * 60 * 1000;

/**
 * Suscribir al newsletter / early access. Crea Customer en Shopify.
 */
export async function subscribeEarlyAccessAction(
  _prev: SubscribeFormState,
  formData: FormData,
): Promise<SubscribeFormState> {
  const { t } = await getRequestT();

  // Honeypot: campo invisible que solo bots rellenan. Devolvemos éxito
  // falso para no avisar al bot de que ha sido detectado — sigue creyendo
  // que se ha suscrito y deja de intentarlo.
  if (String(formData.get("website") ?? "").length > 0) {
    return { ok: true, message: t.comingSoon.thanks };
  }

  const ip = await getClientIp();
  const rl = checkRateLimit(
    `early-subscribe:${ip}`,
    SUBSCRIBE_MAX_ATTEMPTS,
    SUBSCRIBE_WINDOW_MS,
  );
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return {
      ok: false,
      message: tpl(t.comingSoon.tooManyAttempts, { mins }),
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const smsConsent = formData.get("smsConsent") === "on";

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: t.comingSoon.invalidEmail };
  }

  const result = await subscribeCustomer({
    email,
    phone: phone || undefined,
    smsConsent,
  });

  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  return { ok: true, message: t.comingSoon.thanks };
}

export type UnlockFormState = { error: string } | null;

/**
 * Comprueba la password global. Si OK, set cookie y redirige a /.
 */
export async function unlockEarlyAccessAction(
  _prev: UnlockFormState,
  formData: FormData,
): Promise<UnlockFormState> {
  const { t } = await getRequestT();

  const ip = await getClientIp();
  const rl = checkRateLimit(
    `early-unlock:${ip}`,
    UNLOCK_MAX_ATTEMPTS,
    UNLOCK_WINDOW_MS,
  );
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return { error: tpl(t.comingSoon.tooManyAttempts, { mins }) };
  }

  const password = String(formData.get("password") ?? "");
  // Comprueba contra Edge Config (escrito desde /admin), con fallback a env var.
  const state = await getSiteState();
  if (!isValidEarlyAccessPassword(password, state.earlyAccessPassword)) {
    return { error: t.comingSoon.wrongPassword };
  }
  const jar = await cookies();
  jar.set(EARLY_ACCESS_COOKIE, "1", {
    // Solo la lee el proxy (server-side). httpOnly evita que JS de cliente
    // la pueda leer/manipular — no hace falta exponerla.
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  redirect("/");
}
