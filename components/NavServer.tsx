// Server wrapper de Nav. Fetcha las colecciones de Shopify y se las pasa al Nav.
// Usar este en todas las pages → el menú lateral se actualiza solo cuando el
// amigo crea / borra / renombra una colección en Shopify Admin.

import { getCollections } from "@/lib/products-server";
import { isAdmin } from "@/lib/admin-auth";
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

export default async function NavServer() {
  const [collections, admin] = await Promise.all([
    getCollections(),
    isAdmin(),
  ]);
  return (
    <Nav
      isAdmin={admin}
      collections={collections
        .filter((c) => !HIDDEN_COLLECTION_HANDLES.has(c.handle))
        .map((c) => ({
          handle: c.handle,
          title: c.title,
        }))}
    />
  );
}
