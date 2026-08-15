"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import imageLoader from "@/lib/image-loader";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { useCartUI } from "@/lib/cart-ui";
import { useMenuUI } from "@/lib/menu-ui";
import RevealText from "./RevealText";
import { tpl, useLocale, useT } from "@/lib/i18n/client";

export default function CartView() {
  const { items, count, subtotal, removeItem, updateQty, checkoutUrl, isPending } =
    useCartUI();
  const { open: openMenu } = useMenuUI();
  const t = useT();
  const locale = useLocale();

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-IE" : "es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(n);

  if (items.length === 0) {
    return (
      <section className="bg-bone py-12 md:py-20">
        <div className="px-4 sm:px-6 max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors mb-10"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            {t.common.back}
          </Link>

          <div className="flex flex-col items-center text-center gap-6 py-10 md:py-16">
            <span className="size-20 md:size-24 rounded-full bg-bone-dim flex items-center justify-center">
              <ShoppingBag className="size-9 md:size-10 text-ink-soft" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-3">
              <RevealText>
                <h1
                  className="font-display uppercase tracking-tighter leading-none"
                  style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)" }}
                >
                  {t.cart.empty}
                </h1>
              </RevealText>
              <p className="text-ink-soft text-base md:text-lg max-w-sm mx-auto">
                {t.cart.emptyBody}
              </p>
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href="/nuevo-drop"
                className="group inline-flex items-center gap-3 bg-ink text-bone px-6 sm:px-8 py-4 sm:py-5 rounded-full text-base shadow-soft"
              >
                {t.cart.emptyCta}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.25}
                />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-bone py-8 md:py-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          {t.cart.keepShopping}
        </Link>

        <div className="flex items-end justify-between gap-4 mb-8 md:mb-10">
          <RevealText>
            <h1
              className="font-display uppercase tracking-tighter leading-none"
              style={{ fontSize: "clamp(2.4rem, 7vw, 5.5rem)" }}
            >
              {t.cart.title}
            </h1>
          </RevealText>
          <span className="text-ink-soft text-base md:text-lg mb-1 md:mb-2">
            {tpl(t.cart.itemsCount, {
              count,
              label: count === 1 ? t.cart.item : t.cart.items,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          {/* Lista de items */}
          <div className="lg:col-span-7">
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.li
                    key={it.lineId}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 80 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-4 md:gap-6 py-5 md:py-6"
                  >
                    <Link
                      href={it.href}
                      className="relative size-24 sm:size-28 md:size-36 rounded-2xl md:rounded-3xl overflow-hidden bg-bone-dim shrink-0"
                    >
                      <Image
                        loader={imageLoader}
                        src={it.image}
                        alt={it.name}
                        fill
                        sizes="(max-width: 768px) 112px, 144px"
                        className="object-cover [mix-blend-mode:multiply]"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <Link
                            href={it.href}
                            className="font-display uppercase tracking-tighter leading-tight text-lg sm:text-xl md:text-2xl hover:underline underline-offset-4"
                          >
                            {it.name}
                          </Link>
                          <span className="text-sm text-ink-soft">
                            {tpl(t.cart.sizeLabel, { size: it.size })}
                          </span>
                        </div>
                        <button
                          onClick={() => removeItem(it.lineId)}
                          aria-label={tpl(t.cart.removeAria, { name: it.name })}
                          className="size-9 -mr-1 rounded-full hover:bg-ink/5 flex items-center justify-center text-ink-soft hover:text-ink transition-colors shrink-0"
                        >
                          <Trash2 className="size-4" strokeWidth={2} />
                        </button>
                      </div>

                      <div className="flex items-end justify-between gap-3 mt-auto">
                        <div className="inline-flex items-center gap-0.5 bg-ink/5 rounded-full p-1">
                          <button
                            onClick={() => updateQty(it.lineId, -1)}
                            aria-label={t.cart.minusAria}
                            className="size-8 rounded-full hover:bg-bone flex items-center justify-center transition-colors"
                          >
                            <Minus className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <span className="min-w-[28px] text-center text-sm tabular-nums">
                            {it.qty}
                          </span>
                          <button
                            onClick={() => updateQty(it.lineId, 1)}
                            aria-label={t.cart.plusAria}
                            className="size-8 rounded-full hover:bg-bone flex items-center justify-center transition-colors"
                          >
                            <Plus className="size-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-base sm:text-lg tabular-nums">
                            {fmt(it.price * it.qty)}
                          </p>
                          {it.qty > 1 && (
                            <p className="text-xs text-ink-soft/70 tabular-nums">
                              {fmt(it.price)} {t.cart.perUnit}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>

          {/* Resumen sticky */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 flex flex-col gap-5 p-6 md:p-7 rounded-3xl bg-bone-dim/60 overflow-hidden">
              <div className="relative mx-auto size-12 md:size-16 -mt-1">
                <Image
                  loader={imageLoader}
                  src="/logo_mono.png"
                  unoptimized
                  alt="VAIN"
                  fill
                  sizes="64px"
                  className="object-contain object-center"
                />
              </div>
              <h2 className="font-display uppercase tracking-tight text-xl md:text-2xl leading-none">
                {t.cart.summary}
              </h2>

              <div className="flex flex-col gap-2 pt-2 border-t border-ink/10">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-soft">{t.cart.subtotal}</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-ink-soft">{t.cart.shipping}</span>
                  <span className="tabular-nums">{t.cart.shippingCalculated}</span>
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-3 border-t border-ink/10">
                  <span className="text-base">{t.cart.total}</span>
                  <span className="text-2xl tabular-nums">{fmt(subtotal)}</span>
                </div>
                <p className="text-xs text-ink-soft/70 -mt-1">
                  {t.cart.taxesNote} {t.cart.dutiesNote}
                </p>
              </div>

              <motion.a
                href={checkoutUrl ?? "#"}
                aria-disabled={!checkoutUrl || isPending}
                onClick={(e) => {
                  if (!checkoutUrl || isPending) e.preventDefault();
                }}
                whileHover={checkoutUrl && !isPending ? { scale: 1.01 } : undefined}
                whileTap={checkoutUrl && !isPending ? { scale: 0.97 } : undefined}
                className={`group w-full inline-flex items-center justify-center gap-3 px-6 py-5 rounded-full bg-ink text-bone text-base md:text-lg shadow-soft ${
                  !checkoutUrl || isPending ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isPending ? t.cart.updating : t.cart.checkout}
                <ArrowRight
                  className="size-5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.25}
                />
              </motion.a>

              <div className="flex flex-col items-center gap-2 text-xs text-ink-soft/80">
                <span className="flex items-center gap-2">
                  <Lock className="size-3.5 shrink-0" strokeWidth={2} />
                  {t.cart.securePay}
                </span>
                {/* El texto va en su propio span: suelto, al centrarse dejaba
                    el camión descolgado en el borde izquierdo de la tarjeta. */}
                <span className="flex items-start justify-center gap-2 text-center">
                  <Truck
                    className="size-3.5 shrink-0 mt-0.5"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span>{t.cart.shippingNextDay}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={openMenu}
                className="text-center text-sm text-ink-soft/80 hover:text-ink underline underline-offset-4 transition-colors"
              >
                {t.cart.keepShopping}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
