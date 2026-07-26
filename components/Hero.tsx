"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import FadeImage from "./FadeImage";
import MagneticButton from "./MagneticButton";
import { formatPrice, productHref, type Product } from "@/lib/products";
import { tripletTitleColor } from "@/lib/triplet-theme";
import { useLocale, useT } from "@/lib/i18n/client";

type Props = { products?: Product[] };

/** Cada cuántos ms cambia de prenda la portada del drop. */
const ROTATE_MS = 5000;

export default function Hero({ products = [] }: Props) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  // El drop trae la misma prenda en varios colores: la portada los va rotando
  // en vez de enseñar siempre el primero (si no, el gris salía en todas
  // partes). Se para en cuanto el usuario interactúa, para que no le cambie
  // el producto justo al ir a pulsar "Comprar".
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Solo se monta la foto de las prendas ya mostradas: la portada arranca
  // pesando una imagen (la que mide el LCP), no tres.
  const [seen, setSeen] = useState<number[]>([0]);
  const t = useT();
  const locale = useLocale();

  const product = products[active] ?? products[0];
  const rotates = products.length > 1;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    setSeen((s) => (s.includes(active) ? s : [...s, active]));
  }, [active]);

  useEffect(() => {
    if (!rotates || paused) return;
    // Sin animaciones automáticas para quien pide menos movimiento.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((a) => (a + 1) % products.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [rotates, paused, products.length]);

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
              {t.hero.buy}
              <ArrowRight aria-hidden className="size-4 sm:size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
            </Link>
          </MagneticButton>
        </div>
      </section>
    );
  }

  const href = productHref(product);

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-bone"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={() => setPaused(true)}
    >
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
            {products.map((p, i) =>
              seen.includes(i) ? (
                <motion.div
                  key={p.slug}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0"
                >
                  <FadeImage
                    src={p.primaryImage}
                    alt={p.name}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain [mix-blend-mode:multiply] transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </motion.div>
              ) : null,
            )}
            <span className="absolute top-4 left-4 inline-flex items-center px-4 py-2 rounded-full bg-ink text-bone text-xs uppercase tracking-wide">
              {t.nav.newDrop}
            </span>
          </Link>

          {/* Control manual: además de parar la rotación, deja elegir color. */}
          {rotates && (
            <div className="flex justify-center gap-1.5 mt-3">
              {products.map((p, i) => (
                <button
                  key={p.slug}
                  onClick={() => {
                    setActive(i);
                    setPaused(true);
                  }}
                  aria-label={p.name}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-8" : "w-1.5 bg-ink/25 hover:bg-ink/40"
                  }`}
                  style={
                    i === active
                      ? { backgroundColor: tripletTitleColor(p.slug) ?? "#0f0f0f" }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
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

          <motion.h1
            key={product.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="font-display text-ink uppercase leading-none tracking-tighter"
            style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)" }}
          >
            {product.name}
          </motion.h1>

          <div className="flex items-baseline gap-3 justify-center lg:justify-start">
            <span className="text-3xl md:text-4xl">{formatPrice(product.price, locale)}</span>
            {product.oldPrice && (
              <span className="line-through text-ink-soft/50 text-lg">
                {formatPrice(product.oldPrice, locale)}
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
              {/* Precio real del producto: antes iba fijo en los textos
                  ("Comprar Drop/01 — 39,99€") y se quedaba desfasado. */}
              {t.hero.buy} — {formatPrice(product.price, locale)}
              <ArrowRight aria-hidden className="size-4 sm:size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
            </Link>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}
