"use client";

import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { ArrowRight, Check, KeyRound, X } from "lucide-react";
import MetallicLogo from "./MetallicLogo";
import LangSwitcher from "./LangSwitcher";
import LogoErrorBoundary from "./LogoErrorBoundary";

// Modelo 3D del logo (three.js + drei + GLB). Code-split + ssr:false.
// Si carga bien y WebGL responde, ves el cromo real con drag-to-rotate.
// Si algo falla (mobile viejo, GLB corrupto, GPU bloqueada), el error
// boundary cae al MetallicLogo CSS y la página sigue funcionando.
const MetallicLogo3D = dynamic(() => import("./MetallicLogo3D"), {
  ssr: false,
  loading: () => <MetallicLogo />,
});
import {
  subscribeEarlyAccessAction,
  unlockEarlyAccessAction,
  type SubscribeFormState,
  type UnlockFormState,
} from "@/app/actions/early-access";
import { useT } from "@/lib/i18n/client";

export default function ComingSoon() {
  const t = useT();
  const [subState, subAction, subPending] = useActionState<
    SubscribeFormState,
    FormData
  >(subscribeEarlyAccessAction, null);
  const [unlockState, unlockAction, unlockPending] = useActionState<
    UnlockFormState,
    FormData
  >(unlockEarlyAccessAction, null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] bg-bone text-ink flex flex-col">
      {/* Top bar: idioma + entrar con contraseña (sin logo, va en el hero) */}
      <div className="flex items-center justify-end px-4 sm:px-8 py-3 md:py-4 shrink-0">
        <div className="flex items-center gap-2">
          <LangSwitcher variant="menu" />
          <button
            onClick={() => setUnlockOpen(true)}
            aria-label={t.comingSoon.loginPassword}
            className="inline-flex items-center justify-center size-9 rounded-full bg-ink/5 hover:bg-ink/10 transition-colors"
          >
            <KeyRound className="size-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* Hero — todo el contenido cabe sin scroll en viewports ≥ ~640px de alto.
          Layout: logo 3D arriba (compacto), texto + form + social abajo. En md+
          dejamos un poco más de aire pero sin pasar de ~720px de alto total. */}
      <section className="flex-1 flex flex-col items-center px-4 sm:px-6 py-4 text-center">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full max-w-[220px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[380px] mx-auto mb-3 md:mb-5"
        >
          <LogoErrorBoundary fallback={<MetallicLogo />}>
            <MetallicLogo3D />
          </LogoErrorBoundary>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-xl flex flex-col items-center gap-1.5 md:gap-2 mb-4 md:mb-6"
        >
          {/* El drop es el protagonista. El badge "the site opens soon" se quitó. */}
          <h1
            className="font-display uppercase tracking-tighter leading-[0.95]"
            style={{ fontSize: "clamp(1.2rem, 5.5vw, 2.75rem)" }}
          >
            {t.comingSoon.dropTeaser}
          </h1>
          <p className="text-ink-soft text-sm md:text-base max-w-md leading-snug">
            <span className="font-semibold text-ink">{t.comingSoon.offer}</span>{" "}
            {t.comingSoon.subtitle}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          action={subAction}
          className="w-full max-w-[15rem] sm:max-w-xs flex flex-col gap-2 sm:gap-2.5"
        >
          {/* Honeypot. Invisible para humanos, los bots lo rellenan. Si llega
              relleno, la server action descarta silenciosamente sin avisar. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-9999px",
              width: "1px",
              height: "1px",
              opacity: 0,
              pointerEvents: "none",
            }}
          />
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder={t.comingSoon.emailPlaceholder}
            className="w-full px-3.5 py-2 rounded-xl bg-bone-dim/60 border border-ink/10 focus:border-ink focus:outline-none text-[13px] sm:text-sm"
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={subPending || subState?.ok}
            className="mt-1 w-full inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-ink text-bone text-[13px] sm:text-sm shadow-soft disabled:opacity-60"
          >
            {subState?.ok ? (
              <>
                <Check className="size-4" strokeWidth={2.25} />
                {t.comingSoon.inAlready}
              </>
            ) : subPending ? (
              t.comingSoon.sending
            ) : (
              <>
                {t.comingSoon.subscribe}
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </>
            )}
          </motion.button>

          {subState && !subState.ok && (
            <p className="text-sm text-blood text-center">{subState.message}</p>
          )}
          {subState?.ok && (
            <p className="text-sm text-ink-soft text-center">
              {subState.message}
            </p>
          )}
        </motion.form>
        </div>

        {/* Social — pegado al fondo, justo encima del footer */}
        <div className="pt-6 pb-1 flex gap-3">
          <a
            href="https://www.instagram.com/vainspn/"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-full bg-ink/5 hover:bg-ink/10 text-sm transition-colors"
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@vainspn"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-1.5 rounded-full bg-ink/5 hover:bg-ink/10 text-sm transition-colors"
          >
            TikTok
          </a>
        </div>
      </section>

      <footer className="px-4 py-3 text-center text-[11px] md:text-xs text-ink-soft/60 shrink-0">
        {t.comingSoon.footerLine}
      </footer>

      {/* Password modal */}
      <AnimatePresence>
        {unlockOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setUnlockOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-bone rounded-3xl shadow-soft w-full max-w-sm p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display uppercase tracking-tighter text-xl">
                  {t.comingSoon.modalTitle}
                </h2>
                <button
                  onClick={() => setUnlockOpen(false)}
                  aria-label={t.common.close}
                  className="size-8 rounded-full hover:bg-ink/5 flex items-center justify-center text-ink-soft"
                >
                  <X className="size-4" strokeWidth={2.25} />
                </button>
              </div>
              <form action={unlockAction} className="flex flex-col gap-3">
                <input
                  type="password"
                  name="password"
                  required
                  autoFocus
                  placeholder={t.comingSoon.passwordPlaceholder}
                  className="w-full px-5 py-3.5 rounded-2xl bg-bone-dim/60 border border-ink/10 focus:border-ink focus:outline-none text-base"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={unlockPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-ink text-bone disabled:opacity-60"
                >
                  {unlockPending ? t.comingSoon.checking : t.comingSoon.enter}
                </motion.button>
                {unlockState?.error && (
                  <p className="text-sm text-blood text-center">
                    {unlockState.error}
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
