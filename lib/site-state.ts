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

const TEAM_ID = process.env.VERCEL_TEAM_ID ?? "";
const CONFIG_ID = process.env.VERCEL_EDGE_CONFIG_ID ?? "";
const API_TOKEN = process.env.VERCEL_API_TOKEN ?? "";

export const EDGE_CONFIG_READY = Boolean(process.env.EDGE_CONFIG);
export const EDGE_CONFIG_WRITES_READY = Boolean(
  TEAM_ID && CONFIG_ID && API_TOKEN,
);

export type SiteState = {
  comingSoonMode: boolean;
  earlyAccessPassword: string;
  source: "edge-config" | "env";
};

export async function getSiteState(): Promise<SiteState> {
  const envMode =
    (process.env.EARLY_ACCESS_MODE ?? "off").toLowerCase() === "on";
  const envPassword = process.env.EARLY_ACCESS_PASSWORD ?? "";

  if (!EDGE_CONFIG_READY) {
    return {
      comingSoonMode: envMode,
      earlyAccessPassword: envPassword,
      source: "env",
    };
  }

  try {
    const [mode, password] = await Promise.all([
      get<boolean>("comingSoonMode"),
      get<string>("earlyAccessPassword"),
    ]);
    return {
      comingSoonMode: mode ?? envMode,
      earlyAccessPassword: password ?? envPassword,
      source: "edge-config",
    };
  } catch {
    return {
      comingSoonMode: envMode,
      earlyAccessPassword: envPassword,
      source: "env",
    };
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

export async function setComingSoonMode(value: boolean): Promise<WriteResult> {
  return patchEdgeConfig([
    { operation: "upsert", key: "comingSoonMode", value },
  ]);
}

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
