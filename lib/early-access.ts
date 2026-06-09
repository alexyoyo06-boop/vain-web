// Cookie del modo "coming soon" / early access.
//
// El estado (modo activado + password) vive en Edge Config y se lee/valida
// en lib/site-state.ts — AQUÍ solo queda la constante de la cookie.
// (Antes este archivo tenía su propio validador contra env vars; se quitó
// porque duplicaba al de site-state.ts sin comparación timing-safe, y un
// import equivocado habría reintroducido el agujero.)

import "server-only";

export const EARLY_ACCESS_COOKIE = "vain_early_access";
