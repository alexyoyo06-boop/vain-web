"use server";

import { cookies } from "next/headers";
import {
  LOCALE_BANNER_DISMISS_COOKIE,
  LOCALE_COOKIE,
  isLocale,
} from "@/lib/i18n/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const COOKIE_OPTS = {
  httpOnly: false, // el banner la lee en cliente, sin ida y vuelta al servidor
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
} as const;

/**
 * Cambia el idioma. Solo escribe la cookie.
 *
 * AQUÍ HABÍA UN `revalidatePath("/", "layout")` Y HUBO QUE QUITARLO. Tenía
 * sentido cuando las páginas se montaban en cada visita: había que forzar el
 * re-render para que salieran con el diccionario nuevo. Ahora las páginas están
 * pre-generadas, una copia por idioma, y ese revalidate BORRARÍA LAS 11 COPIAS
 * DE TODA LA WEB cada vez que alguien toca el switcher de idioma — que es justo
 * lo contrario de lo que se busca: la siguiente visita tendría que volver a
 * montarlo todo y pagar la CPU que este cambio venía a ahorrar.
 *
 * Ya no hace falta: la cookie decide qué copia sirve el proxy. Quien la cambia
 * solo tiene que recargar, y de eso se encarga el cliente.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const value = String(formData.get("locale") ?? "");
  if (!isLocale(value)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, value, COOKIE_OPTS);
  // Si el usuario ha elegido idioma a mano, no tiene sentido seguir
  // sugiriéndole otro.
  jar.set(LOCALE_BANNER_DISMISS_COOKIE, "1", COOKIE_OPTS);
}

/**
 * Cierra el banner de sugerencia de idioma sin cambiar nada.
 * Una vez cerrado, no se vuelve a mostrar durante un año.
 */
export async function dismissLocaleBannerAction(): Promise<void> {
  const jar = await cookies();
  jar.set(LOCALE_BANNER_DISMISS_COOKIE, "1", COOKIE_OPTS);
}
