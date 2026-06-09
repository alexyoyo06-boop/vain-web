"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  LOCALE_BANNER_DISMISS_COOKIE,
  LOCALE_COOKIE,
  isLocale,
} from "@/lib/i18n/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Cambia el idioma. Setea cookie y revalida todo para que las server
 * components re-rendericen con el diccionario nuevo.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "");
  if (!isLocale(value)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, value, {
    httpOnly: false, // útil leerla en cliente sin round-trip
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  // Aprovechamos para dismiss el banner — si el usuario eligió idioma
  // explícitamente, no tiene sentido seguir sugiriéndole otro.
  jar.set(LOCALE_BANNER_DISMISS_COOKIE, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
  revalidatePath("/", "layout");
}

/**
 * Cierra el banner de sugerencia de idioma sin cambiar nada.
 * Una vez dismissed, no se vuelve a mostrar durante un año.
 */
export async function dismissLocaleBannerAction(): Promise<void> {
  const jar = await cookies();
  jar.set(LOCALE_BANNER_DISMISS_COOKIE, "1", {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}
