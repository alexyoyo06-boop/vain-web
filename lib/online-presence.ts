import "server-only";
import crypto from "node:crypto";
import { getCache } from "@vercel/functions";

/**
 * Cuánta gente hay AHORA MISMO en la web.
 *
 * Esto no sale de Vercel Web Analytics: su API no baja de granularidad de una
 * hora (pedir "los últimos 5 minutos" devuelve la hora entera en curso) y no
 * tiene endpoint de tiempo real. Así que la presencia la llevamos nosotros:
 * cada pestaña abierta manda un latido cada pocos segundos (OnlineBeacon) y
 * aquí se guarda "quién ha dado señales de vida y cuándo".
 *
 * Dónde se guarda: en la Runtime Cache de Vercel, que es un almacén clave-valor
 * COMPARTIDO por todas las instancias de función de la región. Sin ella, cada
 * instancia contaría solo los latidos que le tocaron a ella y el número saldría
 * corto. Si la caché no está disponible (dev local, fallo puntual), se cae al
 * Map en memoria del proceso: sigue funcionando, solo que puede quedarse corto.
 *
 * Nadie identificable queda guardado: la clave es hash(IP) + un id aleatorio de
 * la pestaña, y todo caduca en unos minutos.
 */

/** Se considera "online" a quien ha dado señales en los últimos 5 minutos. */
export const ONLINE_WINDOW_MS = 300_000;

/** Cada cuánto late el navegador. Bastante menor que la ventana: si un latido
 *  se pierde, al visitante le quedan dos más antes de desaparecer del contador.
 *  DUPLICADO en components/OnlineBeacon.tsx (que no puede importar de aquí,
 *  esto es server-only). Si tocas uno, toca el otro. */
export const HEARTBEAT_MS = 120_000;

const CACHE_KEY = "online-visitors";
/**
 * TTL holgado: la ventana real la marca ONLINE_WINDOW_MS al contar.
 * TIENE QUE SER MAYOR QUE ESA VENTANA. Si fueran iguales, la caché compartida
 * tiraría las entradas justo cuando todavía deberían contar y el número saldría
 * corto sin motivo aparente.
 */
const CACHE_TTL_S = 600;

/** Topes de seguridad: el endpoint del latido es público. */
const MAX_ENTRIES = 3000;
const MAX_PER_IP = 5;

/** Lo que se sabe de una pestaña: cuándo latió y desde qué país. */
type Visit = { t: number; c?: string };

/**
 * clave ("hashIP:idPestaña") → visita.
 *
 * El número suelto es el formato viejo (solo el timestamp). Sigue soportado a
 * la lectura: al desplegar, la caché compartida arrastra entradas del formato
 * anterior durante lo que le quede de TTL, y tratarlas como corruptas dejaría
 * el contador a cero justo en ese rato.
 */
type Presence = Record<string, Visit | number>;

const local = new Map<string, Visit>();

// La IP no se guarda en claro: solo se usa para agrupar pestañas del mismo
// sitio y poner un tope por IP. Con sal secreta para que el hash no se pueda
// revertir probando IPs.
const SALT =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "vain";

export function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(`${SALT}:${ip}`)
    .digest("hex")
    .slice(0, 10);
}

/** `null` = no hay caché compartida (dev local o fallo); `{}` = vacía. */
async function readShared(): Promise<Presence | null> {
  try {
    const value = await getCache().get(CACHE_KEY);
    if (!value || typeof value !== "object") return {};
    return value as Presence;
  } catch {
    return null;
  }
}

async function writeShared(presence: Presence): Promise<void> {
  try {
    await getCache().set(CACHE_KEY, presence, {
      ttl: CACHE_TTL_S,
      name: "online-visitors",
    });
  } catch {
    // Sin caché compartida el contador sigue vivo con el Map local.
  }
}

/** Normaliza los dos formatos que pueden venir de la caché compartida. */
function toVisit(raw: Visit | number | undefined): Visit | null {
  if (typeof raw === "number") return { t: raw };
  if (raw && typeof raw === "object" && typeof raw.t === "number") {
    return typeof raw.c === "string" ? { t: raw.t, c: raw.c } : { t: raw.t };
  }
  return null;
}

/**
 * Foto del momento: lo que sabe esta instancia + lo que hay en la caché
 * compartida, quitando a quien ya lleva más de un minuto sin dar señales.
 */
function snapshot(now: number, shared: Presence | null): Map<string, Visit> {
  for (const [key, visit] of local) {
    if (now - visit.t > ONLINE_WINDOW_MS) local.delete(key);
  }

  const merged = new Map(local);
  if (shared) {
    for (const [key, raw] of Object.entries(shared)) {
      const visit = toVisit(raw);
      if (!visit || now - visit.t > ONLINE_WINDOW_MS) continue;
      if (visit.t > (merged.get(key)?.t ?? 0)) merged.set(key, visit);
    }
  }
  return merged;
}

/**
 * Apunta un latido. `ipHash` viene ya hasheada; `id` es el de la pestaña.
 * `country` es el ISO-2 que pone Vercel en la request: dos letras y nada más,
 * lo justo para colocar un punto en el globo del panel.
 */
export async function recordPresence(
  ipHash: string,
  id: string,
  country?: string,
): Promise<void> {
  const now = Date.now();
  const key = `${ipHash}:${id}`;

  const shared = await readShared();
  const merged = snapshot(now, shared);

  // Los topes solo aplican a visitantes NUEVOS: a quien ya está contado nunca
  // se le deja de refrescar el latido (si no, desaparecería a mitad de visita).
  if (!merged.has(key)) {
    if (merged.size >= MAX_ENTRIES) return;
    let sameIp = 0;
    for (const other of merged.keys()) {
      if (other.startsWith(`${ipHash}:`)) sameIp++;
    }
    // Una casa con varios móviles cuenta; un script abriendo ids a mansalva
    // desde una IP, no.
    if (sameIp >= MAX_PER_IP) return;
  }
  // El país puede llegar en un latido y faltar en el siguiente (un proxy raro,
  // una request sin cabecera): en ese caso se conserva el que ya se sabía en
  // vez de borrarlo, o el punto parpadearía en el globo.
  merged.set(key, { t: now, c: country ?? merged.get(key)?.c });

  local.clear();
  for (const [k, visit] of merged) local.set(k, visit);

  // Si dos latidos coinciden, uno pisa al otro y se pierde una entrada: da
  // igual, ese visitante vuelve a latir en 20 s y la ventana es de 60 s.
  if (shared !== null) await writeShared(Object.fromEntries(merged));
}

/** Quién hay ahora mismo, y desde dónde. Leer no escribe en la caché. */
export type OnlineSnapshot = {
  online: number;
  /** ISO-2 → cuántas pestañas. Sin los que llegaron sin país. */
  countries: Record<string, number>;
};

export async function getOnlineSnapshot(): Promise<OnlineSnapshot> {
  const merged = snapshot(Date.now(), await readShared());

  const countries: Record<string, number> = {};
  for (const visit of merged.values()) {
    if (visit.c) countries[visit.c] = (countries[visit.c] ?? 0) + 1;
  }

  return { online: merged.size, countries };
}

/** Cuánta gente hay ahora mismo. */
export async function getOnlineCount(): Promise<number> {
  return (await getOnlineSnapshot()).online;
}
