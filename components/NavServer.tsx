// Server wrapper de Nav. Fetcha las colecciones de Shopify y se las pasa al Nav.
// Usar este en todas las pages → el menú lateral se actualiza solo cuando el
// amigo crea / borra / renombra una colección en Shopify Admin.

import { getCollections } from "@/lib/products-server";
import Nav from "./Nav";

// Colecciones que NO aparecen como item adicional en el menú lateral.
// Algunas las crea Shopify por defecto (frontpage, all); otras coinciden con
// secciones fijas de la web (nuevo-drop, todo, archivo). Si el merchant crea
// una colección "Nuevo drop", se usa internamente para alimentar la página
// /nuevo-drop pero NO sale como item duplicado en el menú.
const HIDDEN_COLLECTION_HANDLES = new Set([
  "frontpage",
  "all",
  "nuevo-drop",
  "new-drop",
  "drop-actual",
  "todo",
  "archivo",
]);

/**
 * AQUÍ NO SE PUEDE LEER NINGUNA COOKIE. Este menú va en todas las páginas, así
 * que cualquier API de request que se use aquí vuelve DINÁMICA la web entera y
 * la obliga a montarse de nuevo en cada visita — que es exactamente lo que
 * agotaba la cuota de CPU y hacía que Vercel pausara el proyecto.
 *
 * Pasó de verdad y costó encontrarlo: había un `isAdmin()` en esta misma
 * función. En local no se notaba porque sin ADMIN_PASSWORD `isAdmin()` sale
 * antes de tocar la cookie y todo se pre-generaba; en producción, con la
 * variable puesta, sí la leía y no quedaba una sola página estática.
 *
 * Si el botón de Admin del menú hace falta, lo decide el navegador leyendo
 * ADMIN_HINT_COOKIE (ver lib/admin-auth.ts).
 */
export default async function NavServer() {
  const collections = await getCollections();
  return (
    <Nav
      collections={collections
        .filter((c) => !HIDDEN_COLLECTION_HANDLES.has(c.handle))
        .map((c) => ({
          handle: c.handle,
          title: c.title,
        }))}
    />
  );
}
