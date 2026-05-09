"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

type Item = {
  name: string;
  tag: string;
  href: string;
  live?: boolean;
  image?: string;
};

const items: Item[] = [
  { name: "Plaid Hoodie", tag: "Drop/01", href: "/hoodies/plaid-hoodie", live: true, image: "/sudadera.webp" },
  { name: "T-Shirts", tag: "Próximamente", href: "#" },
  { name: "Pants", tag: "Próximamente", href: "#" },
  { name: "Headwear", tag: "Próximamente", href: "#" },
  { name: "Archivo", tag: "Sold out", href: "#" },
];

type CardProps = {
  it: Item;
  ariaHidden?: boolean;
  snap?: boolean;
};

function CategoryCard({ it, ariaHidden = false, snap = false }: CardProps) {
  const isInternal = it.href.startsWith("/");
  const Tag: React.ElementType = isInternal ? Link : "a";
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -6 }}
      className={`shrink-0 pr-4 md:pr-5 ${snap ? "snap-start" : ""}`}
      aria-hidden={ariaHidden || undefined}
    >
      <Tag
        href={it.href}
        tabIndex={ariaHidden ? -1 : undefined}
        className="group relative block w-[230px] md:w-[280px] aspect-[3/4] rounded-3xl bg-bone-dim overflow-hidden shadow-soft"
      >
        {it.image ? (
          <Image
            src={it.image}
            alt={it.name}
            fill
            sizes="280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 grid place-items-center text-ink/10 font-display uppercase tracking-tighter"
            style={{ fontSize: "clamp(3rem, 8vw, 6rem)" }}
          >
            {it.name.charAt(0)}
          </div>
        )}

        {it.image && (
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/0 to-ink/0" />
        )}

        <div
          className={`absolute inset-x-0 bottom-0 p-4 md:p-5 flex items-end justify-between gap-3 ${
            it.image ? "text-bone" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <p className={`text-xs md:text-sm ${it.image ? "text-bone/80" : "text-ink-soft/80"}`}>
              {it.tag}
            </p>
            <p className="font-display uppercase text-lg md:text-3xl tracking-tighter leading-none mt-1 break-words">
              {it.name}
            </p>
          </div>
          <div className="shrink-0 size-9 md:size-10 rounded-full bg-bone/95 text-ink backdrop-blur flex items-center justify-center group-hover:bg-ink group-hover:text-bone transition-colors shadow-soft">
            <ArrowRight className="size-3.5 md:size-4" strokeWidth={2.25} />
          </div>
        </div>

        {it.live && (
          <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-ink text-bone text-xs">
            Disponible
          </span>
        )}
      </Tag>
    </motion.div>
  );
}

export default function Categories() {
  const [paused, setPaused] = useState(false);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const posRef = useRef(0);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    const speed = 36; // px por segundo

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!pausedRef.current) {
        const setWidth = el.scrollWidth / 2;
        if (setWidth > 0) {
          posRef.current += speed * dt;
          if (posRef.current >= setWidth) posRef.current -= setWidth;
          el.scrollLeft = Math.round(posRef.current);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleTouchStart = () => {
    pausedRef.current = true;
  };
  const handleTouchEnd = () => {
    setTimeout(() => {
      const el = mobileScrollRef.current;
      if (el) {
        const setWidth = el.scrollWidth / 2;
        let pos = el.scrollLeft;
        if (setWidth > 0 && pos >= setWidth) pos -= setWidth;
        posRef.current = pos;
      }
      pausedRef.current = false;
    }, 700);
  };

  return (
    <section className="bg-bone py-12 md:py-16 overflow-hidden">
      <div className="text-center mb-8 md:mb-10 px-4">
        <p className="text-sm text-ink-soft mb-2">Comprar por categoría</p>
        <h2
          className="font-display uppercase tracking-tighter leading-none"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
        >
          Toda la colección
        </h2>
      </div>

      {/* Mobile: scroll continuo infinito (auto + swipe). Sin snap para que fluya */}
      <div
        ref={mobileScrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="md:hidden overflow-x-auto no-scrollbar overscroll-x-contain pb-3"
      >
        <div className="flex pl-4">
          {items.map((it, i) => (
            <CategoryCard key={`a-${i}`} it={it} />
          ))}
          {items.map((it, i) => (
            <CategoryCard key={`b-${i}`} it={it} ariaHidden />
          ))}
        </div>
      </div>

      {/* Desktop: marquee auto con pausa al hover */}
      <div className="hidden md:block relative">
        <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-bone to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-bone to-transparent pointer-events-none" />

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="flex whitespace-nowrap animate-marquee-thirds"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          {[0, 1, 2].map((groupIdx) => (
            <div key={groupIdx} className="flex shrink-0" aria-hidden={groupIdx > 0 || undefined}>
              {items.map((it, i) => (
                <CategoryCard key={`${groupIdx}-${i}`} it={it} ariaHidden={groupIdx > 0} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
