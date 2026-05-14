"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import FadeImage from "./FadeImage";
import RevealText from "./RevealText";

type Item = {
  name: string;
  tag: string;
  href: string;
  live?: boolean;
  comingSoon?: boolean;
  image?: string;
};

const items: Item[] = [
  { name: "Plaid Hoodie", tag: "Drop/01", href: "/hoodies/plaid-hoodie", live: true, image: "/sudadera.webp" },
  { name: "Tee 01", tag: "Drop/02", href: "#", comingSoon: true },
  { name: "Tee 02", tag: "Drop/02", href: "#", comingSoon: true },
  { name: "Pants 01", tag: "Drop/02", href: "#", comingSoon: true },
];

type CardProps = {
  it: Item;
  ariaHidden?: boolean;
  snap?: boolean;
};

function CategoryCard({ it, ariaHidden = false, snap = false }: CardProps) {
  const inner = (
    <div className={`group relative block w-[280px] md:w-[420px] aspect-[3/4] rounded-3xl bg-bone-dim overflow-hidden ${it.live ? "cursor-pointer" : "cursor-default"}`}>
      {it.image ? (
        <FadeImage
          src={it.image}
          alt={it.name}
          fill
          sizes="(max-width: 768px) 280px, 420px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center text-ink/[0.07] font-display uppercase tracking-tighter select-none"
          style={{ fontSize: "clamp(6rem, 18vw, 14rem)" }}
        >
          {it.name.charAt(0)}
        </div>
      )}

      {it.image && (
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/0 to-ink/0" />
      )}

      {/* Diagonal Coming Soon */}
      {it.comingSoon && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[35deg] w-[200%] py-4 bg-ink text-bone text-base uppercase tracking-[0.25em] text-center whitespace-nowrap opacity-75">
            Coming Soon · Coming Soon · Coming Soon · Coming Soon
          </div>
        </div>
      )}

      {it.live && (
        <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-ink text-bone text-xs z-10">
          Disponible
        </span>
      )}

      {it.live && (
        <div className="absolute top-4 right-4 size-9 md:size-10 rounded-full bg-bone/95 text-ink backdrop-blur flex items-center justify-center group-hover:bg-ink group-hover:text-bone transition-colors shadow-soft z-10">
          <ArrowRight className="size-3.5 md:size-4" strokeWidth={2.25} />
        </div>
      )}

      <div className={`absolute inset-x-0 bottom-0 p-4 md:p-6 ${it.image ? "text-bone" : ""}`}>
        <p className={`text-xs md:text-sm ${it.image ? "text-bone/80" : "text-ink-soft/60"}`}>
          {it.tag}
        </p>
        <p className={`font-display uppercase text-xl md:text-3xl tracking-tighter leading-none mt-1 ${it.comingSoon ? "opacity-40" : ""}`}>
          {it.name}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      whileTap={it.live ? { scale: 0.97 } : undefined}
      whileHover={it.live ? { y: -6 } : undefined}
      className={`shrink-0 pr-4 md:pr-6 ${snap ? "snap-start" : ""}`}
      aria-hidden={ariaHidden || undefined}
    >
      {it.live ? (
        <Link href={it.href} tabIndex={ariaHidden ? -1 : undefined}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}

export default function Categories() {
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);

  // Desktop marquee: rAF + wrap dinámico (resistente a cualquier zoom)
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const desktopGroupRef = useRef<HTMLDivElement>(null);
  const desktopPausedRef = useRef(false);
  const [desktopCopies, setDesktopCopies] = useState(3);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;

    const speed = 36; // px por segundo (auto-scroll)
    let raf = 0;
    let last = performance.now();
    let touching = false;
    let resumeTimer: number | null = null;

    const getSetWidth = () => el.scrollWidth / 3;

    // Wrap en ambos sentidos: el usuario siempre acaba dentro de la copia central
    const wrap = () => {
      const w = getSetWidth();
      if (w <= 0) return;
      if (el.scrollLeft >= 2 * w) {
        el.scrollLeft = el.scrollLeft - w;
        posRef.current = el.scrollLeft;
      } else if (el.scrollLeft < w) {
        el.scrollLeft = el.scrollLeft + w;
        posRef.current = el.scrollLeft;
      }
    };

    const onScroll = () => wrap();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onTouchStart = () => {
      touching = true;
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };
    // Esperamos suficiente para que muera la inercia de iOS antes de retomar el auto-scroll;
    // si el JS escribe scrollLeft durante la inercia, se siente trabado.
    const onTouchEnd = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        touching = false;
        posRef.current = el.scrollLeft;
        resumeTimer = null;
      }, 1600);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // Arranca en la copia central para tener buffer en ambos sentidos
    const init = () => {
      const w = getSetWidth();
      if (w > 0) {
        el.scrollLeft = w;
        posRef.current = w;
      }
    };
    init();
    if (posRef.current === 0) requestAnimationFrame(init);

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!touching) {
        const w = getSetWidth();
        if (w > 0) {
          posRef.current += speed * dt;
          el.scrollLeft = Math.round(posRef.current);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  // Desktop: marquee con rAF y wrap dinámico — siempre infinito a cualquier zoom
  useEffect(() => {
    const track = desktopTrackRef.current;
    const group = desktopGroupRef.current;
    if (!track || !group) return;

    const speed = 50; // px por segundo
    let raf = 0;
    let last = performance.now();
    let x = 0;

    // Asegurar que haya grupos suficientes para tapar el viewport + 1 grupo de buffer
    const ensureCopies = () => {
      const w = group.offsetWidth;
      if (w <= 0) return;
      const needed = Math.max(3, Math.ceil(window.innerWidth / w) + 2);
      setDesktopCopies((c) => (c < needed ? needed : c));
    };
    ensureCopies();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!desktopPausedRef.current) {
        const w = group.offsetWidth;
        if (w > 0) {
          x -= speed * dt;
          while (x <= -w) x += w;
          track.style.transform = `translate3d(${x}px, 0, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      ensureCopies();
      const w = group.offsetWidth;
      if (w > 0) {
        // Re-normalizar x al nuevo rango tras cambio de viewport / zoom
        x = ((x % w) + w) % w;
        if (x > 0) x -= w;
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section id="categorias" className="bg-bone pt-6 pb-12 md:pt-8 md:pb-16 overflow-hidden">
      <div className="text-center mb-8 md:mb-10 px-4">
        <p className="text-sm text-ink-soft mb-2">Comprar por categoría</p>
        <RevealText>
          <h2
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            Toda la colección
          </h2>
        </RevealText>
      </div>

      {/* Mobile: scroll continuo infinito (auto + swipe). 3 copias + wrap en ambos sentidos */}
      <div
        ref={mobileScrollRef}
        className="md:hidden overflow-x-auto no-scrollbar overscroll-x-contain pb-3"
      >
        <div className="flex pl-4">
          {items.map((it, i) => (
            <CategoryCard key={`a-${i}`} it={it} ariaHidden />
          ))}
          {items.map((it, i) => (
            <CategoryCard key={`b-${i}`} it={it} />
          ))}
          {items.map((it, i) => (
            <CategoryCard key={`c-${i}`} it={it} ariaHidden />
          ))}
        </div>
      </div>

      {/* Desktop: marquee auto con rAF + pausa al hover. Wrap dinámico → infinito a cualquier zoom */}
      <div className="hidden md:block relative">
        <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-bone to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-bone to-transparent pointer-events-none" />

        <div
          className="overflow-hidden"
          onMouseEnter={() => { desktopPausedRef.current = true; }}
          onMouseLeave={() => { desktopPausedRef.current = false; }}
        >
          <div
            ref={desktopTrackRef}
            className="flex whitespace-nowrap will-change-transform"
            style={{ transform: "translate3d(0,0,0)" }}
          >
            {Array.from({ length: desktopCopies }).map((_, groupIdx) => (
              <div
                ref={groupIdx === 0 ? desktopGroupRef : undefined}
                key={groupIdx}
                className="flex shrink-0"
                aria-hidden={groupIdx > 0 || undefined}
              >
                {items.map((it, i) => (
                  <CategoryCard key={`${groupIdx}-${i}`} it={it} ariaHidden={groupIdx > 0} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
