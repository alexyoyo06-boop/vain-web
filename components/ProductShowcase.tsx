"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import FadeImage from "./FadeImage";
import MagneticButton from "./MagneticButton";
import { useCartUI } from "@/lib/cart-ui";
import { formatPrice, productHref, type Product, type ProductSize } from "@/lib/products";
import { tpl, useT } from "@/lib/i18n/client";

type Props = { product: Product; reverse?: boolean };

export default function ProductShowcase({ product, reverse = false }: Props) {
  const t = useT();
  const availableSet = new Set(product.sizesAvailable);
  const defaultSize: ProductSize =
    product.modelSize && availableSet.has(product.modelSize)
      ? product.modelSize
      : product.sizesAvailable[0] ??
        product.sizes[Math.floor(product.sizes.length / 2)] ??
        product.sizes[0];
  const [size, setSize] = useState<ProductSize>(defaultSize);
  const [active, setActive] = useState(0);
  const touchStartX = useRef(0);
  const { addItem } = useCartUI();

  const href = productHref(product);

  const handleAdd = () => {
    addItem({
      productHandle: product.slug,
      size,
      name: product.name,
      price: product.price,
      image: product.primaryImage,
      href,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setActive((a) => (a + 1) % product.photos.length);
      else
        setActive((a) => (a - 1 + product.photos.length) % product.photos.length);
    }
  };

  return (
    <section id="shop" className="bg-bone py-10 md:py-20 border-t border-ink/5 first-of-type:border-t-0">
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 px-4 sm:px-6 max-w-7xl mx-auto`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className={`lg:col-span-7 relative ${reverse ? "lg:order-2" : ""}`}
        >
          <div
            className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Link
              href={href}
              aria-label={tpl(t.showcase.viewDetailAria, { name: product.name })}
              className="absolute inset-0 z-0 group"
            >
              {product.photos.map((p, i) => (
                <motion.div
                  key={p.src}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <FadeImage
                    src={p.src}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover [mix-blend-mode:multiply] transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </motion.div>
              ))}
              <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink/85 text-bone text-xs backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {t.showcase.viewDetail}
                <ArrowRight className="size-3.5" strokeWidth={2.25} />
              </span>
            </Link>

            <button
              onClick={() =>
                setActive((a) => (a - 1 + product.photos.length) % product.photos.length)
              }
              aria-label={t.product.photoPrev}
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-bone/90 backdrop-blur hidden md:flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % product.photos.length)}
              aria-label={t.product.photoNext}
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-bone/90 backdrop-blur hidden md:flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
              {product.photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={tpl(t.product.photoAria, { index: i + 1 })}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? "w-8 bg-ink" : "w-1.5 bg-ink/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden md:flex gap-3 mt-3">
            {product.photos.map((p, i) => (
              <motion.button
                key={p.src}
                onClick={() => setActive(i)}
                whileTap={{ scale: 0.94 }}
                className={`relative size-20 rounded-2xl overflow-hidden transition-all ${
                  i === active ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100"
                }`}
              >
                <FadeImage
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={`lg:col-span-5 flex flex-col gap-5 lg:py-8 ${reverse ? "lg:order-1" : ""}`}
        >
          <span className="text-sm text-ink-soft">
            {product.drop} — {t.product.limitedEdition}
          </span>

          <h2
            className="font-display text-ink uppercase leading-none tracking-tighter"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)" }}
          >
            {product.name}
          </h2>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl">{formatPrice(product.price)}</span>
            {product.oldPrice && (
              <span className="line-through text-ink-soft/50 text-lg">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>

          <div
            className="rich-text max-w-md"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />

          {product.details.length > 0 && (
            <ul className="text-ink-soft text-sm leading-relaxed space-y-1 list-disc pl-5 max-w-md">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}

          {product.modelHeight && product.modelSize && (
            <p className="text-xs text-ink-soft/70">
              {tpl(t.product.modelInfo, {
                name: "Thagory",
                height: product.modelHeight,
                size: product.modelSize,
              })}
            </p>
          )}

          <div className="text-sm text-ink-soft border-t border-ink/10 pt-4">
            <p className="text-ink mb-1">{t.showcase.shippingHeader}</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>{t.product.shippingSpain}</li>
              <li>{t.product.shippingEurope}</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <span className="text-sm text-ink-soft">{t.product.size}</span>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const isAvail = availableSet.has(s);
                const isSelected = size === s;
                return (
                  <motion.button
                    key={s}
                    onClick={() => isAvail && setSize(s)}
                    whileTap={isAvail ? { scale: 0.92 } : undefined}
                    disabled={!isAvail}
                    aria-disabled={!isAvail}
                    title={isAvail ? undefined : t.product.outOfStock}
                    className={`min-w-[52px] px-4 py-3 rounded-full text-sm transition-all ${
                      isSelected
                        ? "bg-ink text-bone"
                        : isAvail
                          ? "bg-ink/5 hover:bg-ink/10"
                          : "bg-ink/[0.03] text-ink-soft/40 line-through cursor-not-allowed"
                    }`}
                  >
                    {s}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <MagneticButton className="w-full mt-3">
            <motion.button
              onClick={handleAdd}
              disabled={!availableSet.has(size)}
              whileHover={availableSet.has(size) ? { scale: 1.01 } : undefined}
              whileTap={availableSet.has(size) ? { scale: 0.97 } : undefined}
              className="group w-full inline-flex items-center justify-center gap-3 px-6 py-5 rounded-full text-lg shadow-soft bg-ink text-bone disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableSet.has(size)
                ? tpl(t.product.addToCartWithSize, { size })
                : t.product.outOfStock}
              {availableSet.has(size) && (
                <ArrowRight
                  aria-hidden
                  className="size-5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2.25}
                />
              )}
            </motion.button>
          </MagneticButton>

          <Link
            href={href}
            className="text-center text-sm text-ink-soft/70 hover:text-ink underline underline-offset-4"
          >
            {t.showcase.viewDetailFull}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
