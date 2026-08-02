"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, KeyRound, X } from "lucide-react";
import LangSwitcher from "./LangSwitcher";
// ── LOGO (guardado para cuando volvamos a cerrar la web) ───────────────────
// El logo 3D se ha quitado a propósito: ahora la portada de "cerrado" son los
// 4 vídeos. Para volver a poner el logo, descomenta estos imports y el bloque
// <LogoErrorBoundary> más abajo (marcado igual).
// import dynamic from "next/dynamic";
// import MetallicLogo from "./MetallicLogo";
// import LogoErrorBoundary from "./LogoErrorBoundary";
// const MetallicLogo3D = dynamic(() => import("./MetallicLogo3D"), {
//   ssr: false,
//   loading: () => <MetallicLogo />,
// });
// ───────────────────────────────────────────────────────────────────────────
import {
  subscribeEarlyAccessAction,
  unlockEarlyAccessAction,
  type SubscribeFormState,
  type UnlockFormState,
} from "@/app/actions/early-access";
import { useT } from "@/lib/i18n/client";
import { WALL_MEDIA } from "@/lib/media";

// Portada de "cerrado": UN solo vídeo de fondo (los 4 clips ya vienen apilados
// dentro del propio archivo). Antes eran 4 <video> autoplay a la vez, pero
// iOS Safari limita cuántos vídeos decodifica en paralelo → 2 se quedaban
// congelados/en negro y disparaba el ahorro de batería/datos. Con un único
// decodificador reproduce siempre. El póster es un fotograma estático que se
// ve al instante (y si el autoplay estuviera bloqueado no queda negro).
//   - móvil: los 4 clips apilados (720×1620)
//   - escritorio: 2 clips apilados a lo ancho (960×1080)
// Los archivos viven en el CDN de Shopify, no en public/ — ver lib/media.ts.
const WALL = WALL_MEDIA;

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

  // Elige el vídeo según el ancho (móvil = 4 clips apilados, escritorio = 2).
  // Arranca en "mobile" para el render del servidor (mobile-first) y corrige en
  // cliente. Al cambiar de variante remonta el <video> (key) para que el
  // autoplay vuelva a dispararse limpio.
  const [variant, setVariant] = useState<"mobile" | "desktop">("mobile");
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setVariant(mq.matches ? "desktop" : "mobile");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Arranque robusto del vídeo de fondo. iOS solo hace autoplay si el elemento
  // tiene la PROPIEDAD muted puesta (no basta el atributo), así que la forzamos.
  // Reintenta al poder reproducir, al primer toque/click (por si el autoplay
  // está bloqueado) y al volver de segundo plano.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay);
    const kick = () => tryPlay();
    document.addEventListener("touchstart", kick, { once: true, passive: true });
    document.addEventListener("click", kick, { once: true });
    const onVis = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      v.removeEventListener("canplay", tryPlay);
      document.removeEventListener("touchstart", kick);
      document.removeEventListener("click", kick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [variant]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-ink text-bone flex flex-col">
      {/* Muro de vídeo: un único archivo con los clips ya apilados dentro
          (móvil: 4 · escritorio: 2). object-cover para llenar sin franjas
          negras. El póster cubre el instante de carga (nunca queda en negro). */}
      <div className="absolute inset-0 z-0">
        <video
          key={variant}
          ref={videoRef}
          src={WALL[variant].src}
          poster={WALL[variant].poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="w-full h-full object-cover"
        />
      </div>

      {/* Velo: oscurece arriba y abajo (donde va el texto) y deja ver el vídeo
          en el centro. Sin esto no se leería nada encima. */}
      <div
        aria-hidden
        className="absolute inset-0 z-10 bg-gradient-to-b from-ink/75 via-ink/25 to-ink/85"
      />

      {/* Contenido por encima del muro */}
      <div className="relative z-20 flex flex-col min-h-[100dvh]">
        {/* Top bar: idioma + entrar con contraseña */}
        <div className="flex items-center justify-end px-4 sm:px-8 py-3 md:py-4 shrink-0">
          <div className="flex items-center gap-2">
            <LangSwitcher variant="menu" />
            <button
              onClick={() => setUnlockOpen(true)}
              aria-label={t.comingSoon.loginPassword}
              className="inline-flex items-center justify-center size-9 rounded-full bg-bone/15 hover:bg-bone/25 backdrop-blur text-bone transition-colors"
            >
              <KeyRound className="size-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <section className="flex-1 flex flex-col items-center px-4 sm:px-6 py-4 text-center">
          {/* Logo blanco grande girando (el mismo de la home: logo_mono +
              invert para verse blanco sobre el vídeo + coin-spin) — zona
              superior. El logo 3D metálico anterior sigue guardado (comentado
              arriba, en los imports) por si volvemos a cerrar con él. */}
          <div
            className="flex-1 min-h-0 w-full flex items-center justify-center"
            style={{ perspective: 700 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              className="relative size-40 sm:size-48 md:size-56 animate-coin-spin [transform-style:preserve-3d]"
            >
              <Image
                src="/logo_mono.png"
                alt="VAIN"
                fill
                priority
                sizes="224px"
                className="object-contain invert drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          </div>

          {/* Cartel "Triplet shorts — muy pronto": un poco más abajo (segunda
              mitad de la pantalla). */}
          <div className="flex-1 w-full flex flex-col items-center justify-start pt-1">
            {/* Teaser + form en un panel translúcido: legible caiga lo que caiga
                del vídeo detrás. */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="w-full max-w-sm rounded-3xl bg-ink/45 backdrop-blur-md ring-1 ring-bone/15 px-5 py-6 sm:px-7 sm:py-8 flex flex-col items-center gap-4 shadow-soft"
            >
              <div className="flex flex-col items-center gap-1.5">
                <h1
                  className="font-display uppercase tracking-tighter leading-[0.95] text-bone"
                  style={{ fontSize: "clamp(1.2rem, 5.5vw, 2.5rem)" }}
                >
                  {t.comingSoon.dropTeaser}
                </h1>
                <p className="text-bone/80 text-sm md:text-base max-w-md leading-snug">
                  <span className="font-semibold text-bone">
                    {t.comingSoon.offer}
                  </span>{" "}
                  {t.comingSoon.subtitle}
                </p>
              </div>

              <form
                action={subAction}
                className="w-full max-w-[15rem] sm:max-w-xs flex flex-col gap-2 sm:gap-2.5"
              >
                {/* Honeypot antibots (invisible para humanos). */}
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
                  className="w-full px-3.5 py-2 rounded-xl bg-bone/95 text-ink placeholder-ink-soft border border-transparent focus:border-bone focus:outline-none text-[13px] sm:text-sm"
                />

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  type="submit"
                  disabled={subPending || subState?.ok}
                  className="mt-1 w-full inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-bone text-ink text-[13px] sm:text-sm shadow-soft disabled:opacity-60"
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
                  <p className="text-sm text-red-300 text-center">
                    {subState.message}
                  </p>
                )}
                {subState?.ok && (
                  <p className="text-sm text-bone/80 text-center">
                    {subState.message}
                  </p>
                )}
              </form>
            </motion.div>
          </div>

          {/* Social */}
          <div className="pt-6 pb-1 flex gap-3">
            <a
              href="https://www.instagram.com/vainspn/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-full bg-bone/15 hover:bg-bone/25 backdrop-blur text-bone text-sm transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@vainspn"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-1.5 rounded-full bg-bone/15 hover:bg-bone/25 backdrop-blur text-bone text-sm transition-colors"
            >
              TikTok
            </a>
          </div>
        </section>

        <footer className="px-4 py-3 text-center text-[11px] md:text-xs text-bone/55 shrink-0">
          {t.comingSoon.footerLine}
        </footer>
      </div>

      {/* Password modal */}
      <AnimatePresence>
        {unlockOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setUnlockOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-bone text-ink rounded-3xl shadow-soft w-full max-w-sm p-6 md:p-8"
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
