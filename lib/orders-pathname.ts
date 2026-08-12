/**
 * Cómo se nombra el fichero de cada pedido en el almacén, y cómo se vuelve a
 * leer. Va en su propio módulo (sin `server-only`, sin dependencias) porque es
 * lógica pura y así se puede probar sola: es el sitio donde un error silencioso
 * se traduce en pedidos con fecha equivocada, y eso no se ve hasta meses
 * después mirando una gráfica rara.
 *
 * FORMATO:  pings/{idPedido}_{ISO2}_{lat}_{lng}_{epochMs}.json
 *
 * El registro ES el nombre: no hace falta descargar el contenido de N ficheros
 * para pintar el globo, basta con listar el almacén.
 *
 * POR QUÉ LA FECHA VA EN EL NOMBRE (y no se usa la de subida del fichero):
 * antes la hora salía del `uploadedAt` del almacén. Para un pedido que entra
 * hoy da igual — se guarda al instante. Pero hace imposible importar el
 * histórico de Shopify: todos los pedidos viejos quedarían con la fecha del
 * día de la importación, amontonados, y el filtro por fechas del panel no
 * serviría de nada.
 *
 * POR QUÉ LA FECHA ES LA DEL PEDIDO Y NO `Date.now()`: Shopify reintenta un
 * webhook hasta 48 h. Como el nombre lleva el id del pedido y se sobrescribe,
 * un reintento tiene que producir EXACTAMENTE la misma ruta o dibujaría un
 * segundo punto. Con `Date.now()` cada reintento daría un nombre distinto;
 * con la fecha de creación del pedido, siempre la misma.
 */

export const PINGS_PREFIX = "pings/";

export type PingParts = {
  /** Epoch en ms. */
  t: number;
  /** ISO-3166 alpha-2. */
  code: string;
  lat: number;
  lng: number;
};

/** Ids de Shopify limpios de todo lo que no sea alfanumérico. */
function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || "x";
}

export function encodePingPathname(p: PingParts, id: string): string {
  return `${PINGS_PREFIX}${safeId(id)}_${p.code}_${p.lat}_${p.lng}_${p.t}.json`;
}

/**
 * Lee el nombre. `uploadedAt` es el respaldo para los ficheros del formato
 * viejo, que no llevaban fecha: al desplegar esto el almacén está lleno de
 * ellos y tienen que seguir saliendo en el globo con su fecha aproximada (la
 * de subida, que para ellos es prácticamente la del pedido).
 */
export function decodePingPathname(
  pathname: string,
  uploadedAt: Date,
): PingParts | null {
  if (!pathname.startsWith(PINGS_PREFIX)) return null;

  const name = pathname.slice(PINGS_PREFIX.length).replace(/\.json$/, "");
  const parts = name.split("_");
  if (parts.length < 4) return null;

  const code = parts[1];
  const lat = Number(parts[2]);
  const lng = Number(parts[3]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (!/^[A-Z]{2}$/.test(code)) return null;

  // Formato nuevo: la fecha va en el nombre. Formato viejo: la de subida.
  let t = uploadedAt.getTime();
  if (parts.length >= 5) {
    const parsed = Number(parts[4]);
    // Se valida antes de fiarse: un nombre manipulado o corrupto no puede
    // colar una fecha absurda que descoloque el filtro del panel.
    if (Number.isFinite(parsed) && parsed > 0) t = parsed;
  }

  return { t, code, lat, lng };
}

/**
 * Fecha de creación del pedido, en epoch ms.
 * Shopify la manda en ISO-8601 (`created_at`). Si falta o no se entiende, se
 * cae a "ahora": un pedido en el sitio equivocado del eje del tiempo es mejor
 * que un pedido perdido.
 */
export function orderCreatedAtMs(
  createdAt: string | null | undefined,
  now = Date.now(),
): number {
  if (!createdAt) return now;
  const parsed = Date.parse(createdAt);
  if (!Number.isFinite(parsed) || parsed <= 0) return now;
  // Un pedido del futuro es un dato malo (reloj mal puesto, campo raro):
  // se trata como de ahora en vez de mandarlo al final del histórico.
  return parsed > now ? now : parsed;
}
