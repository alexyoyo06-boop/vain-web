"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import imageLoader from "@/lib/image-loader";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { useCartUI } from "@/lib/cart-ui";
import { tpl, useT } from "@/lib/i18n/client";

export default function CartToast() {
  const { toast, dismissToast } = useCartUI();
  const t = useT();

  return (
    <div
      className="fixed z-[55] inset-x-3 top-20 flex justify-center sm:justify-end sm:right-4 sm:left-auto sm:inset-x-auto pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="pointer-events-auto w-full sm:w-[360px] bg-ink text-bone rounded-3xl shadow-soft overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3 pr-2">
              <div className="relative size-14 rounded-2xl overflow-hidden bg-bone-dim shrink-0">
                <Image
                  loader={imageLoader}
                  src={toast.image}
                  alt={toast.name}
                  fill
                  sizes="56px"
                  className="object-cover [mix-blend-mode:multiply]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-bone/70">
                  <Check className="size-3" strokeWidth={2.75} />
                  {t.cartToast.added}
                </p>
                <p className="font-display uppercase tracking-tight text-sm leading-tight mt-0.5 truncate">
                  {toast.name}
                </p>
                <p className="text-xs text-bone/60 mt-0.5">{tpl(t.cartToast.sizeLabel, { size: toast.size })}</p>
              </div>
              <button
                onClick={dismissToast}
                aria-label={t.cartToast.closeAria}
                className="size-8 rounded-full hover:bg-bone/10 flex items-center justify-center text-bone/70 hover:text-bone transition-colors shrink-0"
              >
                <X className="size-3.5" strokeWidth={2.25} />
              </button>
            </div>
            <Link
              href="/cart"
              onClick={dismissToast}
              className="group flex items-center justify-between gap-3 px-4 py-3 bg-bone/5 hover:bg-bone/10 transition-colors text-sm"
            >
              <span>{t.cartToast.viewCartCta}</span>
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                strokeWidth={2.25}
              />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
