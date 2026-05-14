"use client";

import { ArrowUpRight, Asterisk } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const renderPhrase = (key: string) => (
  <span
    key={key}
    className="shrink-0 inline-flex items-center font-display uppercase tracking-tighter leading-none pr-8 md:pr-12"
    style={{ fontSize: "clamp(4rem, 18vw, 18rem)" }}
  >
    VAIN
    <Asterisk
      className="ml-[0.15em] shrink-0"
      style={{ width: "0.7em", height: "0.7em" }}
      strokeWidth={1.5}
    />
  </span>
);

export default function Footer() {
  const half = Array.from({ length: 6 });
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);
  const [groupCount, setGroupCount] = useState(3);

  useEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;
    let speed = 0;
    const computeSpeed = () => {
      const w = group.offsetWidth || 1;
      speed = isMobile ? w / 10 : w / 60;
    };
    computeSpeed();

    const ensureCopies = () => {
      const w = group.offsetWidth;
      if (w <= 0) return;
      const needed = Math.max(3, Math.ceil(window.innerWidth / w) + 2);
      setGroupCount((c) => (c < needed ? needed : c));
    };
    ensureCopies();

    let raf = 0;
    let last = performance.now();
    let x = 0;
    let multiplier = 1;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = canHover && hoveredRef.current ? 4 : 1;
      multiplier += (target - multiplier) * 0.06;
      x -= speed * multiplier * dt;
      const w = group.offsetWidth;
      if (w > 0) {
        while (x <= -w) x += w;
      }
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onResize = () => {
      computeSpeed();
      ensureCopies();
      const w = group.offsetWidth;
      if (w > 0) {
        // Re-normalizar x al nuevo rango tras zoom / resize → sin saltos
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
    <footer className="bg-ink text-bone rounded-t-[40px] md:rounded-t-[64px] mt-8 overflow-hidden">
      <div
        className="overflow-hidden py-2 md:cursor-pointer"
        onMouseEnter={() => { hoveredRef.current = true; }}
        onMouseLeave={() => { hoveredRef.current = false; }}
      >
        <div
          ref={trackRef}
          className="flex whitespace-nowrap will-change-transform"
          style={{ transform: "translate3d(0,0,0)" }}
        >
          {Array.from({ length: groupCount }).map((_, gi) => (
            <div
              ref={gi === 0 ? groupRef : undefined}
              key={gi}
              className="flex shrink-0"
              aria-hidden={gi > 0 || undefined}
            >
              {half.map((_, i) => renderPhrase(`${gi}-${i}`))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 px-6 sm:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="sm:col-span-2 md:col-span-4 flex flex-col gap-4">
          <span
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(2.4rem, 4vw, 3rem)" }}
          >
            VAIN
          </span>
          <p className="text-bone/70 text-base max-w-sm">
            Streetwear hecho en España. Drops limitados, calidad real.
          </p>
        </div>

        <div className="md:col-span-2 flex flex-col gap-3">
          <span className="text-bone/50 text-sm">Tienda</span>
          <Link href="/hoodies" className="hover:text-bone transition-colors">Hoodies</Link>
          <a href="#shop" className="hover:text-bone transition-colors">Drop/01</a>
          <a href="#" className="hover:text-bone transition-colors">Próximo drop</a>
          <a href="#" className="hover:text-bone transition-colors">Archivo</a>
        </div>

        <div className="md:col-span-3 flex flex-col gap-3">
          <span className="text-bone/50 text-sm">Legal</span>
          <Link href="/policies/privacy-policy" className="hover:text-bone transition-colors">Política de privacidad</Link>
          <Link href="/policies/shipping-policy" className="hover:text-bone transition-colors">Política de envío</Link>
          <Link href="/policies/refund-policy" className="hover:text-bone transition-colors">Política de reembolso</Link>
          <Link href="/policies/terms-of-service" className="hover:text-bone transition-colors">Términos del servicio</Link>
          <Link href="/policies/legal-notice" className="hover:text-bone transition-colors">Aviso legal</Link>
          <Link href="/policies/contact-information" className="hover:text-bone transition-colors">Información de contacto</Link>
        </div>

        <div className="sm:col-span-2 md:col-span-3 flex flex-col gap-4">
          <span className="text-bone/50 text-sm">Síguenos</span>
          <a
            href="https://www.instagram.com/vainspn/"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 font-display uppercase tracking-tighter leading-none hover:text-bone transition-colors"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)" }}
          >
            Instagram
            <ArrowUpRight
              aria-hidden
              className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              style={{ width: "0.7em", height: "0.7em" }}
              strokeWidth={2}
            />
          </a>
          <a
            href="https://www.tiktok.com/@vainspn"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 font-display uppercase tracking-tighter leading-none hover:text-bone transition-colors"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)" }}
          >
            TikTok
            <ArrowUpRight
              aria-hidden
              className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              style={{ width: "0.7em", height: "0.7em" }}
              strokeWidth={2}
            />
          </a>
          <a
            href="mailto:press@v4in.com"
            className="text-bone/70 hover:text-bone underline underline-offset-4"
          >
            Colabos / prensa: press@v4in.com
          </a>
        </div>
      </div>

      <div className="border-t border-bone/10 px-6 sm:px-8 py-5 flex flex-wrap justify-between items-center gap-2 text-sm text-bone/50">
        <span>© 2026, VAIN — Todos los derechos reservados.</span>
        <span>Hecho en España</span>
      </div>
    </footer>
  );
}
