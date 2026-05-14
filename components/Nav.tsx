"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";

const categories = [
  { name: "Hoodies", count: 1, href: "/hoodies" },
  { name: "T-Shirts", count: 0, href: "#next-drop", soon: true },
  { name: "Pants", count: 0, href: "#next-drop", soon: true },
  { name: "Headwear", count: 0, href: "#next-drop", soon: true },
  { name: "Archivo", count: 4, href: "#shop" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Si el navegador guarda la página en bfcache con overflow:hidden,
  // al volver con el botón atrás veríamos la página bloqueada / en blanco.
  useEffect(() => {
    const reset = () => {
      document.body.style.overflow = "";
    };
    window.addEventListener("pagehide", reset);
    return () => window.removeEventListener("pagehide", reset);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all ${
          scrolled ? "bg-bone/80 backdrop-blur-lg" : "bg-bone"
        }`}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-ink/5 hover:scale-105 transition-transform text-sm"
          >
            <span className="flex flex-col gap-1">
              <span className="block w-4 h-px bg-current" />
              <span className="block w-4 h-px bg-current" />
            </span>
            <span className="hidden sm:inline">Menú</span>
          </motion.button>

          <Link
            href="/"
            aria-label="VAIN — Inicio"
            className="absolute left-1/2 -translate-x-1/2 select-none"
          >
            <div className="relative w-24 md:w-32 h-7">
              <Image
                src="/logo_index.png"
                alt="VAIN"
                fill
                priority
                sizes="128px"
                className="object-contain"
              />
            </div>
          </Link>

          <motion.a
            whileTap={{ scale: 0.94 }}
            href="#shop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-bone hover:scale-105 transition-transform text-sm"
          >
            Carrito
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-bone/20 text-xs">
              0
            </span>
          </motion.a>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-bone"
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                aria-label="VAIN — Inicio"
                className="select-none"
              >
                <div className="relative w-24 md:w-32 h-7">
                  <Image
                    src="/logo_index.png"
                    alt="VAIN"
                    fill
                    sizes="128px"
                    className="object-contain"
                  />
                </div>
              </Link>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(false)}
                className="size-10 rounded-full bg-ink text-bone flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Cerrar menú"
              >
                <X className="size-5" strokeWidth={2.25} />
              </motion.button>
            </div>

            <div className="px-4 sm:px-6 py-6 md:py-12 max-w-3xl mx-auto">
              <p className="text-sm text-ink-soft/70 mb-6">Categorías</p>
              <ul className="flex flex-col">
                {categories.map((c, i) => {
                  const isInternal = c.href.startsWith("/");
                  const inner = (
                    <>
                      <span
                        className="font-display uppercase tracking-tight leading-none group-hover:translate-x-2 transition-transform"
                        style={{ fontSize: "clamp(2.2rem, 7vw, 4.5rem)" }}
                      >
                        {c.name}
                      </span>
                      <span className="text-xs text-ink-soft/60">
                        {c.soon ? "Próximamente" : `${c.count} pieza${c.count === 1 ? "" : "s"}`}
                      </span>
                    </>
                  );
                  const className =
                    "group flex items-baseline justify-between border-b border-ink/15 py-5 hover:border-ink transition-colors active:scale-[0.98] transition-transform";
                  return (
                    <motion.li
                      key={c.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i }}
                    >
                      {isInternal ? (
                        <Link href={c.href} onClick={() => setOpen(false)} className={className}>
                          {inner}
                        </Link>
                      ) : (
                        <a href={c.href} onClick={() => setOpen(false)} className={className}>
                          {inner}
                        </a>
                      )}
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-12 flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/vainspn/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-ink/5 hover:scale-105 transition-transform text-sm"
                >
                  Instagram
                  <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
                </a>
                <a
                  href="https://www.tiktok.com/@vainspn"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full bg-ink/5 hover:scale-105 transition-transform text-sm"
                >
                  TikTok
                  <ArrowUpRight className="size-3.5" strokeWidth={2.25} />
                </a>
                <a
                  href="mailto:press@v4in.com"
                  className="inline-block px-5 py-3 rounded-full bg-ink/5 hover:scale-105 transition-transform text-sm"
                >
                  press@v4in.com
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
