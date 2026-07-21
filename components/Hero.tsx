"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import FadeImage from "./FadeImage";
import MagneticButton from "./MagneticButton";
import { formatPrice, productHref, type Product } from "@/lib/products";
import { useT } from "@/lib/i18n/client";

type Props = { product?: Product };

export default function Hero({ product }: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const t = useT();

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Sin catálogo: portada mínima de marca para que la home nunca quede vacía.
  if (!product) {
    return (
      <section id="top" className="relative overflow-hidden bg-bone">
        <div className="px-4 sm:px-6 py-16 md:py-24 max-w-2xl mx-auto flex flex-col items-center gap-6 text-center">
          <p className="text-lg md:text-2xl text-ink-soft leading-snug">
            {t.hero.taglineLine1}
            <br />
            {t.hero.taglineLine2}
          </p>
          <MagneticButton>
            <Link
              href="/todo"
              className="group inline-flex items-center gap-3 bg-ink text-bone px-6 sm:px-8 py-4 sm:py-5 rounded-full text-sm sm:text-base md:text-lg shadow-soft"
            >
              {t.hero.buyFull}
              <ArrowRight aria-hidden className="size-4 sm:size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
            </Link>
          </MagneticButton>
        </div>
      </section>
    );
  }

  const href = productHref(product);

  return (
    <section id="top" className="relative overflow-hidden bg-bone">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 px-4 sm:px-6 pt-3 md:pt-6 pb-6 md:pb-10 max-w-7xl mx-auto items-center">
        {/* Foto del drop */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="lg:col-span-7"
        >
          <Link
            href={href}
            aria-label={product.name}
            className="group block relative aspect-[4/5] max-h-[60vh] sm:aspect-square sm:max-h-none lg:aspect-auto lg:h-[56vh] lg:max-h-[560px] lg:min-h-[400px] rounded-3xl bg-bone-dim overflow-hidden shadow-soft"
            style={{ transform: `translate3d(${mouse.x * -6}px, ${mouse.y * -4}px, 0)` }}
          >
            <FadeImage
              src={product.primaryImage}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-contain [mix-blend-mode:multiply] transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute top-4 left-4 inline-flex items-center px-4 py-2 rounded-full bg-ink text-bone text-xs uppercase tracking-wide">
              {t.nav.newDrop}
            </span>
          </Link>
        </motion.div>

        {/* Detalle */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="lg:col-span-5 flex flex-col gap-4 md:gap-5 text-center lg:text-left items-center lg:items-start"
        >
          <span className="text-sm text-ink-soft">
            {product.drop} — {t.product.limitedEdition}
          </span>

          <h1
            className="font-display text-ink uppercase leading-none tracking-tighter"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            {product.name}
          </h1>

          <div className="flex items-baseline gap-3 justify-center lg:justify-start">
            <span className="text-3xl md:text-4xl">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="line-through text-ink-soft/50 text-lg">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-base md:text-lg text-ink-soft leading-snug max-w-md">
              {product.shortDescription}
            </p>
          )}

          <MagneticButton className="mt-2">
            <Link
              href={href}
              className="group inline-flex items-center gap-3 bg-ink text-bone px-6 sm:px-8 py-4 sm:py-5 rounded-full text-base md:text-lg shadow-soft"
            >
              <span className="hidden sm:inline">{t.hero.buyFull}</span>
              <span className="sm:hidden">{t.hero.buyShort}</span>
              <ArrowRight aria-hidden className="size-4 sm:size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
            </Link>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
