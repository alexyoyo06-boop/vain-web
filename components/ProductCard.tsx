"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { formatPrice, productHref, type Product } from "@/lib/products";
import { useLocale } from "@/lib/i18n/client";

type Props = {
  product: Product;
  /** Index en el grid, usado para el delay escalonado de la animación. */
  index?: number;
};

/**
 * Card de producto reutilizable. Hace tres cosas:
 *   - Desktop: al hacer hover, fade-in de la 2ª foto del producto.
 *   - Móvil: swipe lateral para cyclear entre TODAS las fotos sin entrar
 *     al detalle. Tap normal → navega al detalle.
 *   - Dots de paginación visibles si el producto tiene más de una foto.
 *
 * El swipe se detecta con un threshold de 50px. Si hubo swipe, prevenimos
 * el click del Link para que no navegue al levantar el dedo.
 */
export default function ProductCard({ product, index = 0 }: Props) {
  const locale = useLocale();
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchStartX = useRef(0);
  const isSwipingRef = useRef(false);

  const photos = product.photos.length > 0
    ? product.photos
    : [{ src: product.primaryImage, alt: product.name }];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwipingRef.current = false;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (dx > 10) isSwipingRef.current = true;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50 && photos.length > 1) {
      if (dx < 0) setActive((a) => (a + 1) % photos.length);
      else setActive((a) => (a - 1 + photos.length) % photos.length);
    }
    // Reset del flag con timeout para que el onClick del Link lo vea
    // todavía activo y haga preventDefault si hubo swipe.
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 50);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSwipingRef.current) {
      e.preventDefault();
    }
  };

  // En desktop, hover = mostrar la 2ª foto. En móvil, swipe controla el índice.
  const desktopHoverIdx =
    hovered && photos.length > 1 ? 1 : 0;
  // Si el usuario ha movido el swipe en móvil, prevalece su índice.
  const displayIdx = active !== 0 ? active : desktopHoverIdx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={productHref(product)}
        className="group block"
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          whileHover={{ y: -6 }}
          whileTap={{ scale: 0.98 }}
          className="relative aspect-[3/4] rounded-2xl md:rounded-3xl bg-bone-dim overflow-hidden shadow-soft mb-2 md:mb-4"
        >
          {photos.map((photo, i) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className={`object-cover [mix-blend-mode:multiply] transition-opacity duration-500 ${
                i === displayIdx ? "opacity-100" : "opacity-0"
              }`}
              priority={index < 3 && i === 0}
            />
          ))}

          <span className="absolute top-2 left-2 md:top-4 md:left-4 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-ink text-bone text-[10px] md:text-xs z-10">
            {product.drop}
          </span>

          <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 size-7 md:size-11 rounded-full bg-bone/95 backdrop-blur flex items-center justify-center transition-all group-hover:bg-ink group-hover:text-bone z-10">
            <ArrowRight className="size-3.5 md:size-4" strokeWidth={2.25} />
          </div>

          {/* Dots de paginación. Solo si hay más de una foto. En móvil
              indican que se puede deslizar; en desktop también funcionan
              como click pero su utilidad principal es móvil. */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10 md:hidden">
              {photos.map((_, i) => (
                <span
                  key={i}
                  aria-hidden
                  className={`h-1 rounded-full transition-all ${
                    i === displayIdx ? "w-4 bg-ink" : "w-1 bg-ink/30"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-0">
          <div>
            <p className="font-display uppercase text-sm md:text-2xl tracking-tighter leading-tight">
              {product.name}
            </p>
            <p className="text-[11px] md:text-sm text-ink-soft mt-0.5 md:mt-1">
              {product.drop}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-sm md:text-lg">{formatPrice(product.price, locale)}</p>
            {product.oldPrice && (
              <p className="text-[10px] md:text-xs line-through text-ink-soft/50">
                {formatPrice(product.oldPrice, locale)}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
