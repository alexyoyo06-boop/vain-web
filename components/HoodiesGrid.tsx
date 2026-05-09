"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const hoodies = [
  {
    slug: "plaid-hoodie",
    name: "Plaid Hoodie",
    price: "€39,99",
    oldPrice: "€59,99",
    image: "/sudadera.webp",
    hoverImage: "/vistiendola.webp",
    drop: "Drop/01",
    href: "/hoodies/plaid-hoodie",
  },
];

export default function HoodiesGrid() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="bg-bone py-10 md:py-16">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            Volver
          </Link>
          <h1
            className="font-display uppercase tracking-tighter leading-none mt-4"
            style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
          >
            Hoodies
          </h1>
          <p className="text-ink-soft mt-3 text-base md:text-lg">
            {hoodies.length} pieza{hoodies.length === 1 ? "" : "s"} disponible
            {hoodies.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 md:gap-6">
          {hoodies.map((h, i) => (
            <motion.div
              key={h.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              onMouseEnter={() => setHovered(h.slug)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link href={h.href} className="group block">
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative aspect-[3/4] rounded-2xl md:rounded-3xl bg-bone-dim overflow-hidden shadow-soft mb-2 md:mb-4"
                >
                  <Image
                    src={h.image}
                    alt={h.name}
                    fill
                    sizes="(max-width: 768px) 33vw, 33vw"
                    className={`object-cover transition-opacity duration-500 ${
                      hovered === h.slug ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  <Image
                    src={h.hoverImage}
                    alt={`${h.name} vestida`}
                    fill
                    sizes="(max-width: 768px) 33vw, 33vw"
                    className={`object-cover transition-opacity duration-500 ${
                      hovered === h.slug ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <span className="absolute top-2 left-2 md:top-4 md:left-4 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-ink text-bone text-[10px] md:text-xs z-10">
                    {h.drop}
                  </span>
                  <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 size-7 md:size-11 rounded-full bg-bone/95 backdrop-blur flex items-center justify-center transition-all group-hover:bg-ink group-hover:text-bone z-10">
                    <ArrowRight className="size-3.5 md:size-4" strokeWidth={2.25} />
                  </div>
                </motion.div>
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-0">
                  <div>
                    <p className="font-display uppercase text-sm md:text-2xl tracking-tighter leading-tight">
                      {h.name}
                    </p>
                    <p className="text-[11px] md:text-sm text-ink-soft mt-0.5 md:mt-1">{h.drop}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-sm md:text-lg">{h.price}</p>
                    <p className="text-[10px] md:text-xs line-through text-ink-soft/50">
                      {h.oldPrice}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 md:mt-24 p-8 md:p-12 rounded-3xl bg-bone-dim/60 text-center">
          <p className="text-sm text-ink-soft mb-2">Próximo drop</p>
          <p
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Más hoodies en camino
          </p>
          <p className="text-ink-soft mt-3 max-w-md mx-auto">
            Apúntate al menú lateral para enterarte antes que nadie del próximo
            drop.
          </p>
        </div>
      </div>
    </section>
  );
}
