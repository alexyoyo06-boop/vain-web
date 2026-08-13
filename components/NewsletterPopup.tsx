"use client";

import { useActionState, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react";
import {
  subscribeEarlyAccessAction,
  type SubscribeFormState,
} from "@/app/actions/early-access";
import { useT } from "@/lib/i18n/client";

// Dos flags en localStorage:
//  - SEEN: el popup ya ha salido una vez (no volver a abrirlo solo, pero SÍ
//    mostrar el círculo "10% OFF" para reabrirlo si lo cerraron sin querer).
//  - CLAIMED: ya se han suscrito → ni popup ni círculo (ya tienen su 10%).
const SEEN_KEY = "vain_popup_10_seen";
const CLAIMED_KEY = "vain_popup_10_claimed";
// Código del 10% que se ENSEÑA al suscribirse (no depende de que llegue ningún
// correo). DEBE existir en Shopify: Descuentos → Crear → 10% → este código.
// El botón "Usar mi 10%" lleva a /discount/<code>, que next.config redirige a
// Shopify y lo autoaplica en el carrito. Cambia el código aquí si usas otro.
const DISCOUNT_CODE = "PICKYOURFAV";
// Aparece a los ~5 s de estar en la tienda (no nada más entrar).
const DELAY_MS = 5000;
// Dónde NO sale: la de "cerrado" ya pide el email y admin no es tienda.
const HIDDEN_PREFIXES = ["/coming-soon", "/admin"];

/**
 * Popup del 10% + círculo flotante para reabrirlo. Captura el email de verdad
 * (misma server action que el early access → crea el cliente en Shopify, que
 * le manda su 10% por correo).
 *
 * Flujo: sale solo a los 5 s (una vez). Si lo cierran, queda un círculo
 * "10% OFF" abajo a la izquierda para reabrirlo. Al suscribirse, desaparece
 * todo. No sale en /coming-soon ni /admin. Montado en el layout raíz.
 */
export default function NewsletterPopup() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, action, pending] = useActionState<SubscribeFormState, FormData>(
    subscribeEarlyAccessAction,
    null,
  );

  const hidden = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p));

  const openPopup = () => {
    setOpen(true);
    setSeen(true);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  };

  useEffect(() => {
    if (hidden) return;
    // Ayuda de PRUEBA (SOLO en desarrollo): abrir /?popup=1 fuerza la burbuja
    // ignorando los flags de "ya visto / ya reclamado", para poder probar con
    // varios correos. En PRODUCCIÓN no hace nada → el "solo una vez por
    // persona" queda intacto al desplegar a Vercel.
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("popup") === "1"
    ) {
      setOpen(true);
      return;
    }
    let alreadySeen = false;
    try {
      if (localStorage.getItem(CLAIMED_KEY)) {
        setClaimed(true);
        return; // ya tienen su 10%: nada de popup ni círculo
      }
      alreadySeen = !!localStorage.getItem(SEEN_KEY);
    } catch {
      // localStorage bloqueado (incógnito estricto): tratamos como no visto.
    }
    if (alreadySeen) {
      setSeen(true); // no reabrir solo, pero sí mostrar el círculo
      return;
    }
    const id = setTimeout(() => {
      // Si lo que hay pintado es el muro de "web cerrada", no molestar: ya
      // está pidiendo el email él. La URL no lo delata (el proxy sirve el muro
      // por rewrite, así que el pathname sigue siendo "/"), por eso se mira la
      // marca que deja ComingSoon en el DOM.
      if (document.querySelector("[data-vain-wall]")) return;
      openPopup();
    }, DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  // Suscrito con éxito → no volver a molestar (ni popup ni círculo).
  useEffect(() => {
    if (state?.ok) {
      setClaimed(true);
      try {
        localStorage.setItem(CLAIMED_KEY, "1");
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
    }
  }, [state?.ok]);

  if (hidden) return null;

  const showCircle = seen && !claimed && !open;

  return (
    <>
      {/* Círculo flotante "10% OFF" para reabrir el popup (abajo a la izq). */}
      <AnimatePresence>
        {showCircle && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={openPopup}
            aria-label={t.popup.title}
            className="fixed bottom-5 left-5 z-[85] size-16 rounded-full bg-ink text-bone shadow-soft flex flex-col items-center justify-center leading-none hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="text-base font-bold">10%</span>
            <span className="text-[10px] tracking-[0.2em] mt-0.5">OFF</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[90] bg-ink/45 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="relative bg-bone text-ink rounded-3xl shadow-soft w-full max-w-md p-7 sm:p-9 text-center"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label={t.popup.close}
                className="absolute top-4 right-4 size-8 rounded-full hover:bg-ink/5 flex items-center justify-center text-ink-soft transition-colors"
              >
                <X className="size-4" strokeWidth={2.25} />
              </button>

              {state?.ok ? (
                <div className="flex flex-col items-center gap-4 py-3">
                  <div className="size-12 rounded-full bg-ink text-bone flex items-center justify-center">
                    <Check className="size-6" strokeWidth={2.5} />
                  </div>
                  <p className="text-lg font-medium">{t.popup.successHeading}</p>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(DISCOUNT_CODE).catch(() => {});
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}
                    aria-label={t.popup.copyHint}
                    className="w-full rounded-2xl border-2 border-dashed border-ink/25 bg-bone-dim/50 px-4 py-3 font-display uppercase tracking-[0.15em] text-xl sm:text-2xl break-words hover:border-ink/50 transition-colors"
                  >
                    {copied ? t.popup.copied : DISCOUNT_CODE}
                  </button>
                  <a
                    href={`/discount/${DISCOUNT_CODE}`}
                    className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-ink text-bone text-sm sm:text-base shadow-soft"
                  >
                    {t.popup.useDiscount}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-1"
                      strokeWidth={2.25}
                    />
                  </a>
                </div>
              ) : (
                <>
                  <h2
                    className="font-display uppercase tracking-tighter leading-[0.95]"
                    style={{ fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }}
                  >
                    {t.popup.title}
                  </h2>
                  <p className="text-ink-soft mt-2 mb-5 text-sm sm:text-base">
                    {t.popup.subtitle}
                  </p>

                  <form action={action} className="flex flex-col gap-2.5">
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
                      className="w-full px-4 py-3 rounded-2xl bg-bone-dim/60 border border-ink/10 focus:border-ink focus:outline-none text-sm sm:text-base"
                    />
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={pending}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-ink text-bone text-sm sm:text-base shadow-soft disabled:opacity-60"
                    >
                      {pending ? t.comingSoon.sending : t.popup.cta}
                      <ArrowRight className="size-4" strokeWidth={2.25} />
                    </motion.button>
                    {state && !state.ok && (
                      <p className="text-sm text-blood">{state.message}</p>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
