"use client";

// Modal de sugerencia de idioma. Aparece centrado en pantalla con backdrop
// cuando el país de la IP sugiere un idioma distinto al que se está
// sirviendo. Una vez interactuado, se setea cookie de dismiss y no vuelve
// a salir durante un año.

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { dismissLocaleBannerAction, setLocaleAction } from "@/app/actions/locale";
import { useT, tpl } from "@/lib/i18n/client";
import { LOCALE_LABEL, LOCALE_NATIVE_NAME, type Locale } from "@/lib/i18n/config";

type Props = { suggestedLocale: Locale };

export default function LocaleBanner({ suggestedLocale }: Props) {
  const langName = LOCALE_NATIVE_NAME[suggestedLocale];
  // El estado abre/cierra al instante en cliente — la server action se
  // dispara en background sin bloquear la UX. El modal arranca cerrado y
  // se abre tras un microdelay para que la animación de entrada se vea
  // (si arrancase abierto, en SSR ya estaría visible sin animación).
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    const id = window.setTimeout(() => setOpen(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  // Bloquea scroll del body mientras el modal está abierto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // IMPORTANTE: las server actions se invocan vía `<form action>` (no
  // handlers onClick sueltos) porque así Next gestiona el ciclo de
  // submission + revalidación de las server components que dependen de
  // la cookie. Si la llamáramos como función plana desde onClick, la
  // cookie cambiaría en el server pero el cliente seguiría viendo el HTML
  // antiguo hasta una recarga manual.
  const switchLocale = async () => {
    setOpen(false);
    const fd = new FormData();
    fd.set("locale", suggestedLocale);
    await setLocaleAction(fd);
  };
  const dismiss = async () => {
    setOpen(false);
    await dismissLocaleBannerAction();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        >
          {/* Backdrop clickable como form para invocar la server action de
              dismiss correctamente (Next refresca tras submit). */}
          <form action={dismiss} className="absolute inset-0">
            <button
              type="submit"
              aria-label={t.lang.bannerCloseAria}
              className="absolute inset-0 w-full h-full cursor-default"
            />
          </form>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            role="dialog"
            aria-modal="true"
            aria-label={t.lang.ariaSwitch}
            className="relative w-full max-w-sm bg-bone rounded-3xl shadow-soft overflow-hidden"
          >
            <form action={dismiss}>
              <button
                type="submit"
                aria-label={t.lang.bannerCloseAria}
                className="absolute top-3 right-3 size-8 rounded-full inline-flex items-center justify-center text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors z-10"
              >
                <X className="size-4" strokeWidth={2.25} />
              </button>
            </form>

            <div className="px-7 py-8 flex flex-col items-center text-center gap-5">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-ink text-bone text-xs uppercase tracking-[0.18em]">
                {LOCALE_LABEL[suggestedLocale]}
              </span>

              <p className="text-ink text-base leading-relaxed max-w-[18rem]">
                {tpl(t.lang.bannerOffer, { language: langName })}
              </p>

              <div className="flex flex-col gap-2 w-full pt-1">
                <form action={switchLocale} className="w-full">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.01 }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-bone text-sm shadow-soft"
                  >
                    {tpl(t.lang.bannerSwitchTo, { language: langName })}
                  </motion.button>
                </form>
                <form action={dismiss} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm text-ink-soft hover:text-ink transition-colors"
                  >
                    {t.lang.bannerKeep}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
