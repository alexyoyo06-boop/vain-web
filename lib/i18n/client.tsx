"use client";

// Provider para que los Client Components lean el diccionario y el locale
// sin tener que volverlos async. El root layout (server) lee el dict y lo
// inyecta aquí. Cero requests cliente.

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionary";

type Ctx = {
  locale: Locale;
  t: Dictionary;
};

const LocaleCtx = createContext<Ctx | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: ReactNode;
}) {
  return (
    <LocaleCtx.Provider value={{ locale, t: dict }}>
      {children}
    </LocaleCtx.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useLocale fuera de <LocaleProvider>");
  return ctx.locale;
}

export function useT(): Dictionary {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error("useT fuera de <LocaleProvider>");
  return ctx.t;
}

/** Reemplaza placeholders `{var}` por valores. */
export function tpl(
  s: string,
  vars: Record<string, string | number> = {},
): string {
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}
