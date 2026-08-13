import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./config";

/**
 * El idioma que viene en la URL interna (`/l/es/todo`), validado.
 *
 * Next tipa los `params` como `string` porque un segmento dinámico puede traer
 * cualquier cosa, así que hay que estrecharlo a mano. Y hay que hacerlo de
 * verdad, no con un `as`: aunque `dynamicParams = false` ya hace que solo se
 * sirvan los 11 idiomas generados, un `as Locale` mentiroso dejaría pasar
 * basura silenciosamente si algún día eso cambia — y el fallo aparecería
 * mucho después, como un diccionario `undefined` reventando el render.
 */
export function localeParam(locale: string): Locale {
  if (!isLocale(locale)) notFound();
  return locale;
}
