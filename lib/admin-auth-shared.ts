// Constantes de admin que necesitan LOS DOS LADOS. Este fichero no lleva
// "server-only" a propósito: lib/admin-auth.ts sí lo lleva (tiene el HMAC y la
// password) y por eso no se puede importar desde el navegador.

/**
 * Marca SIN VALOR DE SEGURIDAD que dice "este navegador hizo login de admin".
 *
 * Existe solo para que el menú pueda pintar el botón de Admin sin preguntar al
 * servidor. Antes lo decidía `isAdmin()` dentro de NavServer, y como `isAdmin()`
 * lee cookies, eso volvía DINÁMICA cada página que lleva menú — o sea, la web
 * entera se montaba de nuevo en cada visita y no servía de nada tenerla
 * pre-generada. (Se veía solo en producción: sin ADMIN_PASSWORD, `isAdmin()`
 * sale antes de tocar la cookie, así que en local todo parecía estático.)
 *
 * Que sea falsificable da igual: no abre nada. Quien se la ponga a mano solo
 * consigue ver un enlace a /admin; al entrar, el panel exige la cookie firmada
 * de verdad (httpOnly) y le manda al login.
 */
export const ADMIN_HINT_COOKIE = "vain_admin_hint";
