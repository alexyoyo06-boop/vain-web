"use client";

// Selector de idioma. Con muchos idiomas usamos un desplegable compacto en
// vez de pills. Cada opción es un <form> que invoca setLocaleAction (server
// action), que setea la cookie y hace revalidatePath para re-renderizar todo
// con el diccionario nuevo.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe } from "lucide-react";
import { setLocaleAction } from "@/app/actions/locale";
import {
  LOCALES,
  LOCALE_LABEL,
  LOCALE_NATIVE_NAME,
} from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";

type Variant = "footer" | "menu";

export default function LangSwitcher({
  variant = "footer",
  light = false,
}: {
  variant?: Variant;
  /** Sobre foto (barra fundida en la home): pinta el botón en claro. */
  light?: boolean;
}) {
  const current = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // footer vive abajo del todo → el panel abre hacia arriba.
  // menu (barra superior) → abre hacia abajo.
  const openUp = variant === "footer";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <motion.button
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.lang.ariaSwitch}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-xs uppercase tracking-wider ${
          light
            ? "bg-bone/20 text-bone hover:bg-bone/30"
            : "bg-ink/5 hover:bg-ink/10"
        }`}
      >
        <Globe className="size-3.5" strokeWidth={2.25} aria-hidden />
        {LOCALE_LABEL[current]}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            role="listbox"
            aria-label={t.lang.ariaSwitch}
            className={`absolute z-50 end-0 w-44 max-h-72 overflow-y-auto no-scrollbar rounded-2xl bg-bone shadow-soft border border-ink/10 p-1.5 ${
              openUp ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {LOCALES.map((loc) => {
              const active = loc === current;
              return (
                // Tras cambiar el idioma hay que recargar: qué copia
                // pre-generada se sirve lo decide el proxy leyendo la cookie, y
                // eso solo ocurre en una petición nueva. Antes bastaba con la
                // server action porque la página se montaba entera en cada
                // visita; ahora no.
                <form
                  key={loc}
                  action={async (fd: FormData) => {
                    await setLocaleAction(fd);
                    window.location.reload();
                  }}
                >
                  <input type="hidden" name="locale" value={loc} />
                  <button
                    type="submit"
                    role="option"
                    aria-selected={active}
                    onClick={() => setOpen(false)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors ${
                      active ? "bg-ink text-bone" : "text-ink hover:bg-ink/5"
                    }`}
                  >
                    <span>{LOCALE_NATIVE_NAME[loc]}</span>
                    <span
                      className={`text-[10px] uppercase tracking-wider ${
                        active ? "opacity-70" : "text-ink-soft"
                      }`}
                    >
                      {LOCALE_LABEL[loc]}
                    </span>
                  </button>
                </form>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
