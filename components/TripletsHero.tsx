"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPrice, productHref, type Product } from "@/lib/products";
import { TRIPLET_COLORS, TRIPLET_ORDER } from "@/lib/triplet-theme";
import { useT } from "@/lib/i18n/client";

// Posición final de cada logo en el abanico (offset en % del ancho del propio
// logo → escala sola en móvil porque el ancho es clamp(vw)).
const FAN = [
  { x: "-50%", y: "-10%", rotate: -8 }, // rosa, atrás-izquierda
  { x: "0%", y: "6%", rotate: 0 }, // gris, centro
  { x: "50%", y: "22%", rotate: 8 }, // azul, delante-derecha
] as const;

// Flag a nivel de módulo: la intro se anima una vez por CARGA de página. Se
// mutará en useEffect (no en el render) para no romper SSR/hidratación: el
// servidor siempre renderiza con la animación, y al volver de una ficha por
// navegación interna (sin recarga) el módulo sigue vivo → no se repite. Una
// recarga completa reinicia el módulo → vuelve a animar.
let introPlayed = false;

// Logo VAIN recoloreado vía CSS mask sobre triplet-mark.png (silueta nítida con
// alpha). Solo importa el canal alpha de la máscara → el color lo pone el
// background. drop-shadow respeta la forma de la máscara.
function Mark({ color, className }: { color: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`w-full ${className ?? ""}`}
      style={{
        aspectRatio: "535 / 559",
        backgroundColor: color,
        WebkitMaskImage: "url(/triplet-mark.png)",
        maskImage: "url(/triplet-mark.png)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        filter: "drop-shadow(0 18px 28px rgba(15,15,15,0.16))",
      }}
    />
  );
}

type Props = { products?: Product[] };

export default function TripletsHero({ products = [] }: Props) {
  const t = useT();
  const reduce = useReducedMotion();
  const router = useRouter();
  // Carrusel móvil: seguimos el scroll para iluminar el dot de paginación.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // Tap vs swipe/scroll en el carrusel (touch). Sin esto, el scroll-snap se
  // come el tap; y si solo miramos X, un scroll VERTICAL que empieza sobre una
  // carta navega al producto solo. Por eso medimos X e Y.
  const touchRef = useRef<{ x: number; y: number; drag: boolean } | null>(null);
  const scrollRafRef = useRef(0);
  // Animar solo en la primera carga (no al volver de una ficha). SSR-safe:
  // el módulo solo se muta en el efecto, así el render del servidor y la
  // primera hidratación coinciden (ambos animan).
  const [shouldAnimate] = useState(() => !introPlayed);
  useEffect(() => {
    introPlayed = true;
  }, []);

  // Cada slot del abanico/carta = un triplet (rosa, gris, azul) con su color y,
  // si ya está subido a Shopify, su producto real (foto + ruta).
  const triplets = TRIPLET_ORDER.map((slug) => ({
    slug,
    color: TRIPLET_COLORS[slug],
    product: products.find((p) => p.slug === slug),
  }));

  // Índice activo a partir del progreso de scroll (robusto con snap-center: 0 al
  // inicio, 2 al final, 1 en medio). goToCard mueve el carrusel al tocar un dot.
  const onCarouselScroll = () => {
    // Throttle a 1 vez por frame + solo re-render si cambia el índice → evita
    // tirones por re-renders en cada evento de scroll.
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = 0;
      const el = scrollRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      const idx = max > 0 ? Math.round((el.scrollLeft / max) * 2) : 0;
      setActiveIdx((prev) => (prev === idx ? prev : idx));
    });
  };
  const goToCard = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: (max * i) / 2, behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-bone">
      <div className="min-h-[calc(100svh-3.5rem)] md:min-h-[calc(100svh-4rem)] px-4 sm:px-6 py-3 md:py-4 max-w-6xl mx-auto flex flex-col items-center justify-center gap-3 md:gap-6">
        {/* Abanico de los 3 logos */}
        <div className="relative w-full max-w-[680px] h-[clamp(155px,26vh,250px)] md:h-[clamp(150px,30vh,290px)]">
          {triplets.map((trip, i) => (
            <div
              key={trip.slug}
              className="absolute inset-0 flex items-center justify-center"
              style={{ zIndex: i + 1 }}
            >
              <motion.div
                initial={
                  !shouldAnimate
                    ? false
                    : reduce
                      ? { opacity: 0 }
                      : { opacity: 0, x: "-140%", rotate: -16 }
                }
                animate={
                  reduce
                    ? { opacity: 1 }
                    : {
                        opacity: 1,
                        x: FAN[i].x,
                        y: FAN[i].y,
                        rotate: FAN[i].rotate,
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 62,
                  damping: 16,
                  delay: 0.15 + i * 0.16,
                }}
                className="w-[clamp(120px,20vh,195px)] md:w-[clamp(120px,22vh,210px)] will-change-transform"
              >
                <Mark color={trip.color} />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Las 3 prendas — sin recuadro: el pantalón flota (foto en multiply
            sobre el fondo) con el color SOLO como glow detrás. Cada uno enlaza a
            su ficha. Entran con fundido escalonado DESPUÉS de los logos. Si algún
            triplet aún no está en Shopify, cae a un placeholder con el logo. */}
        <div
          ref={scrollRef}
          onScroll={onCarouselScroll}
          className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 w-full overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        >
          {triplets.map((trip, i) => {
            const p = trip.product;
            return (
              <motion.div
                key={trip.slug}
                initial={shouldAnimate ? { opacity: 0, y: 30 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.95 + i * 0.14,
                  duration: 0.6,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
                className="relative snap-center shrink-0 basis-[88%] md:basis-auto"
              >
                {/* Glow de color detrás del pantalón */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-[8%] h-[70%] -z-10 opacity-50"
                  style={{
                    background: `radial-gradient(circle at 50% 45%, ${trip.color}, transparent 62%)`,
                    filter: "blur(34px)",
                  }}
                />
                {p ? (
                  <Link
                    href={productHref(p)}
                    aria-label={p.name}
                    onTouchStart={(e) => {
                      touchRef.current = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        drag: false,
                      };
                    }}
                    onTouchMove={(e) => {
                      const tr = touchRef.current;
                      if (
                        tr &&
                        (Math.abs(e.touches[0].clientX - tr.x) > 10 ||
                          Math.abs(e.touches[0].clientY - tr.y) > 10)
                      ) {
                        tr.drag = true;
                      }
                    }}
                    onTouchEnd={(e) => {
                      const tr = touchRef.current;
                      touchRef.current = null;
                      // Tap limpio → navegamos nosotros (el snap no se lo come).
                      // Swipe → no navegar, dejar que el carrusel haga scroll.
                      if (tr && !tr.drag) {
                        e.preventDefault();
                        router.push(productHref(p));
                      }
                    }}
                    className="group relative block"
                  >
                    <div className="relative w-full aspect-square md:aspect-auto md:h-[clamp(200px,36vh,400px)]">
                      <Image
                        src={p.primaryImage}
                        alt={p.name}
                        fill
                        sizes="(max-width: 640px) 30vw, 300px"
                        className="object-contain [mix-blend-mode:multiply] transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="mt-1.5 flex flex-col items-center text-center">
                      <span className="font-display uppercase tracking-tighter text-[11px] sm:text-sm md:text-base leading-none">
                        {p.name}
                      </span>
                      <span className="text-[10px] sm:text-xs text-ink-soft tabular-nums">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 aspect-square md:aspect-auto md:h-[clamp(200px,36vh,400px)]">
                    <div className="w-[42%] opacity-95">
                      <Mark color={trip.color} />
                    </div>
                    <span className="text-[9px] sm:text-[11px] text-ink-soft uppercase tracking-wide">
                      {t.grid.comingSoon}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Dots de paginación del carrusel (solo móvil). El activo se tiñe del
            color del triplet que estás viendo. */}
        <div className="md:hidden flex items-center justify-center gap-2 -mt-1">
          {triplets.map((trip, i) => (
            <button
              key={trip.slug}
              onClick={() => goToCard(i)}
              aria-label={trip.product?.name ?? trip.slug}
              className={`h-2 rounded-full transition-all ${
                i === activeIdx ? "w-6" : "w-2 bg-ink/20"
              }`}
              style={i === activeIdx ? { backgroundColor: trip.color } : undefined}
            />
          ))}
        </div>

        {/* CTA al drop completo */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.5 }}
        >
          <Link
            href="/nuevo-drop"
            className="group inline-flex items-center gap-2.5 rounded-full bg-ink text-bone px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base shadow-soft"
          >
            {t.hero.discoverDrop}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-1"
              strokeWidth={2.25}
            />
          </Link>
        </motion.div>
      </div>

      {/* Pista de scroll: hay más web debajo. Baja al Hero del drop. */}
      <motion.a
        href="#top"
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 0.6 }}
        aria-label={t.hero.discoverDrop}
        className="hidden md:block absolute bottom-5 left-1/2 -translate-x-1/2 text-ink-soft hover:text-ink transition-colors"
      >
        <motion.span
          aria-hidden
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="block"
        >
          <ChevronDown className="size-7" strokeWidth={2.25} />
        </motion.span>
      </motion.a>
    </section>
  );
}

