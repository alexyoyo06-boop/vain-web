"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
          className={`absolute inset-x-0 bottom-0 p-5 flex items-end justify-between ${
            it.image ? "text-bone" : ""
          }`}
        >
          <div>
            <p className={`text-sm ${it.image ? "text-bone/80" : "text-ink-soft/80"}`}>
              {it.tag}
            </p>
            <p className="font-display uppercase text-2xl md:text-3xl tracking-tighter leading-none mt-1">
              {it.name}
            </p>
          </div>
          <div className="size-10 rounded-full bg-ink text-bone flex items-center justify-center text-sm group-hover:bg-blood transition-colors">
            →
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

      {/* Mobile: deslizable con el dedo, snap a cada card */}
      <div className="md:hidden overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-pl-4 overscroll-x-contain">
        <div className="flex pl-4 pr-4">
          {items.map((it, i) => (
            <CategoryCard key={i} it={it} snap />
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
