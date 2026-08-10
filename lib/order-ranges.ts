/**
 * Rangos de fecha del globo del panel, al estilo del selector de Shopify.
 *
 * Van en un módulo compartido porque los usan los dos lados: el navegador para
 * pintar los botones y pedir, y `/api/online` para decidir desde cuándo contar.
 * Si estuvieran duplicados, un día dejarían de coincidir y el panel enseñaría
 * un rango distinto del que dice el botón.
 *
 * EL CORTE SE CALCULA EN HORA DE MADRID, no en UTC. "Hoy" tiene que empezar a
 * medianoche de aquí: con UTC, entre las 00:00 y las 02:00 de un día de verano
 * "hoy" enseñaría también pedidos de ayer, que es justo el tipo de detalle que
 * hace desconfiar de un panel.
 */

export const ORDERS_TZ = "Europe/Madrid";

export const ORDER_RANGES = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
  { id: "anio", label: "Este año" },
  { id: "todo", label: "Todo" },
] as const;

export type OrderRangeId = (typeof ORDER_RANGES)[number]["id"];

export const DEFAULT_ORDER_RANGE: OrderRangeId = "30d";

export function isOrderRange(value: string): value is OrderRangeId {
  return ORDER_RANGES.some((r) => r.id === value);
}

export function orderRangeLabel(id: OrderRangeId): string {
  return ORDER_RANGES.find((r) => r.id === id)?.label ?? id;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cuántos milisegundos hay que sumarle a un instante UTC para leerlo en Madrid.
 * Se saca formateando la fecha en esa zona y volviéndola a montar como si fuera
 * UTC: la diferencia es el desfase que aplicaba en ESE instante, con su horario
 * de verano incluido.
 */
function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ORDERS_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // `hour` puede venir como 24 a medianoche según el entorno; Date.UTC lo
  // normaliza al día siguiente igual que haría el reloj.
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asIfUtc - at.getTime();
}

/** Medianoche (en Madrid) del día que contiene `at`, en epoch ms. */
function startOfDayMadrid(at: Date): number {
  const offset = tzOffsetMs(at);
  const local = new Date(at.getTime() + offset);
  const midnightAsUtc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  return midnightAsUtc - offset;
}

/** 1 de enero (en Madrid) del año que contiene `at`, en epoch ms. */
function startOfYearMadrid(at: Date): number {
  const offset = tzOffsetMs(at);
  const local = new Date(at.getTime() + offset);
  const janFirstAsUtc = Date.UTC(local.getUTCFullYear(), 0, 1);
  // El desfase de enero puede no ser el de hoy (horario de verano), así que se
  // recalcula sobre la fecha ya estimada.
  const approx = new Date(janFirstAsUtc - offset);
  return janFirstAsUtc - tzOffsetMs(approx);
}

/**
 * Desde cuándo contar, en epoch ms. `0` = sin corte (todo el histórico).
 *
 * "7 días" son los 7 días naturales anteriores contando hoy entero, como en
 * Shopify: no "hace exactamente 168 horas", que dejaría fuera media mañana.
 */
export function orderRangeCutoff(id: OrderRangeId, now = new Date()): number {
  switch (id) {
    case "hoy":
      return startOfDayMadrid(now);
    case "7d":
      return startOfDayMadrid(now) - 6 * DAY_MS;
    case "30d":
      return startOfDayMadrid(now) - 29 * DAY_MS;
    case "90d":
      return startOfDayMadrid(now) - 89 * DAY_MS;
    case "anio":
      return startOfYearMadrid(now);
    case "todo":
      return 0;
  }
}
