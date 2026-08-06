// Estado runtime del sitio: si está cerrada (coming soon) y la password
// para entrar con acceso anticipado. Vive en Vercel Edge Config:
//   - Reads: gratis, sub-5ms desde cualquier región (perfecto para proxy)
//   - Writes: vía Vercel REST API con un personal access token
//
// Caemos a env vars si Edge Config no responde (primera carga, sin token,
// proyecto local sin EDGE_CONFIG configurado, etc.).

import "server-only";
import crypto from "node:crypto";
import { get } from "@vercel/edge-config";

// .trim() no es paranoia: estas tres se metieron en Vercel con `echo |`, que
// cuela un salto de línea al final del valor. Un token con "\n" pegado hace
// que la API conteste 403 sin decir por qué. Ver también lib/vercel-analytics.
const TEAM_ID = (process.env.VERCEL_TEAM_ID ?? "").trim();
const CONFIG_ID = (process.env.VERCEL_EDGE_CONFIG_ID ?? "").trim();
const API_TOKEN = (process.env.VERCEL_API_TOKEN ?? "").trim();

export const EDGE_CONFIG_READY = Boolean(process.env.EDGE_CONFIG);
export const EDGE_CONFIG_WRITES_READY = Boolean(
  TEAM_ID && CONFIG_ID && API_TOKEN,
);

export type SiteState = {
  comingSoonMode: boolean;
  earlyAccessPassword: string;
  source: "edge-config" | "env";
};

/**
 * Abierta/cerrada sale SIEMPRE de la env var, nunca de Edge Config: el proxy
 * decide con esta misma variable (ver proxy.ts) y el panel tiene que enseñar
 * lo que de verdad está pasando, no otra fuente que podría no coincidir.
 */
export function isComingSoonMode(): boolean {
  return (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";
}

export async function getSiteState(): Promise<SiteState> {
  const envPassword = process.env.EARLY_ACCESS_PASSWORD ?? "";
  const comingSoonMode = isComingSoonMode();

  if (!EDGE_CONFIG_READY) {
    return { comingSoonMode, earlyAccessPassword: envPassword, source: "env" };
  }

  // Sólo la password. Esto se lee al canjearla en el muro y al abrir /admin:
  // decenas de lecturas al mes, no decenas de miles.
  try {
    const password = await get<string>("earlyAccessPassword");
    return {
      comingSoonMode,
      earlyAccessPassword: password ?? envPassword,
      source: "edge-config",
    };
  } catch {
    return { comingSoonMode, earlyAccessPassword: envPassword, source: "env" };
  }
}

export type WriteResult =
  | { ok: true }
  | { ok: false; error: string };

type ItemOp = {
  operation: "create" | "update" | "upsert" | "delete";
  key: string;
  value?: unknown;
};

async function patchEdgeConfig(items: ItemOp[]): Promise<WriteResult> {
  if (!EDGE_CONFIG_WRITES_READY) {
    return {
      ok: false,
      error:
        "Faltan VERCEL_API_TOKEN / VERCEL_TEAM_ID / VERCEL_EDGE_CONFIG_ID. Configúralas.",
    };
  }
  try {
    const res = await fetch(
      `https://api.vercel.com/v1/edge-config/${CONFIG_ID}/items?teamId=${TEAM_ID}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Vercel API ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error desconocido.",
    };
  }
}

// Ya no hay setComingSoonMode(): abrir/cerrar la web se hace cambiando la env
// var EARLY_ACCESS_MODE en Vercel + redeploy. Escribir el flag aquí no serviría
// de nada, porque el proxy ya no lo lee (ver el comentario largo en proxy.ts).

export async function setEarlyAccessPassword(
  value: string,
): Promise<WriteResult> {
  return patchEdgeConfig([
    { operation: "upsert", key: "earlyAccessPassword", value },
  ]);
}

export function isValidEarlyAccessPassword(
  input: string,
  expected: string,
): boolean {
  if (!expected) return false;
  // Comparación en tiempo constante (mismo truco que el login admin):
  // hasheamos ambos lados para igualar longitudes y que timingSafeEqual
  // no lance ni filtre la longitud de la password por timing.
  const ha = crypto
    .createHash("sha256")
    .update(input.trim().toLowerCase())
    .digest();
  const hb = crypto.createHash("sha256").update(expected.toLowerCase()).digest();
  return crypto.timingSafeEqual(ha, hb);
}
