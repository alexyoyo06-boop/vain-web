"use client";

import Image from "next/image";
import imageLoader from "@/lib/image-loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { formatPrice, productHref, type Product } from "@/lib/products";
import {
  TRIPLET_COLORS,
  TRIPLET_ORDER,
  TRIPLET_PHOTO_SCALE,
} from "@/lib/triplet-theme";
import { useLocale, useT } from "@/lib/i18n/client";

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
  const locale = useLocale();
  const router = useRouter();
  // Carrusel móvil: seguimos el scroll para iluminar el dot de paginación.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  // Tap vs swipe/scroll en el carrusel (touch). Sin esto, el scroll-snap se
  // come el tap; y si solo miramos X, un scroll VERTICAL que empieza sobre una
  // carta navega al producto solo. Por eso medimos X e Y.
  const touchRef = useRef<{ x: number; y: number; drag: boolean } | null>(null);
  const scrollRafRef = useRef(0);

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
      {/* Sin los logos, la sección ya no necesita ocupar la pantalla entera:
          se ajusta a las prendas. Ancho amplio (no max-w-6xl) para que los tres
          pantalones caigan bajo los tres de la foto del banner. */}
      <div className="px-4 sm:px-6 py-8 md:py-14 max-w-[1600px] mx-auto flex flex-col items-center justify-center gap-4 md:gap-8">
        {/* Las 3 prendas — sin recuadro: el pantalón flota (foto en multiply
            sobre el fondo) con el color SOLO como glow detrás. Cada uno enlaza a
            su ficha. Van en el mismo orden que la foto del banner de arriba
            (gris · azul · rosa) para que se lean como continuación de ella. Si
            algún triplet aún no está en Shopify, cae a un placeholder. */}
        <div
          ref={scrollRef}
          onScroll={onCarouselScroll}
          // Carrusel móvil centrado: la tarjeta mide 88vw y sobran 12vw, así que
          // 6vw de padding a cada lado dejan la prenda justo en el centro de la
          // pantalla. Con padding fijo (px-4) quedaba desplazada a la izquierda,
          // porque el 88% se medía sobre el ancho YA descontado el padding.
          className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 w-full overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none no-scrollbar -mx-4 px-[6vw] md:mx-0 md:px-0"
        >
          {triplets.map((trip) => {
            const p = trip.product;
            return (
              <motion.div
                key={trip.slug}
                initial={false}
                className="relative snap-center shrink-0 w-[88vw] md:w-auto"
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
                    {/* `scale` (propiedad CSS, no transform) para no pisar el
                        transform del hover de la imagen: se componen. */}
                    <div
                      className="relative w-full aspect-[4/3] md:aspect-auto md:h-[clamp(280px,48vh,560px)]"
                      style={{ scale: TRIPLET_PHOTO_SCALE[trip.slug] ?? 1 }}
                    >
                      <Image
                        loader={imageLoader}
                        src={p.primaryImage}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 88vw, 500px"
                        className="object-contain [mix-blend-mode:multiply] transition-transform duration-500 group-hover:scale-[1.05]"
                      />
                    </div>
                    <div className="mt-3 md:mt-4 flex flex-col items-center text-center gap-0.5">
                      <span className="font-display uppercase tracking-tighter text-sm sm:text-base md:text-xl leading-none">
                        {p.name}
                      </span>
                      {/* Agotado: se sigue enseñando la prenda (la foto es el
                          escaparate del drop) pero con la etiqueta en vez del
                          precio, para no hacer creer que se puede comprar. */}
                      {p.available ? (
                        <span className="text-xs md:text-sm text-ink-soft tabular-nums">
                          {formatPrice(p.price, locale)}
                        </span>
                      ) : (
                        <span className="text-xs md:text-sm text-ink-soft/70 uppercase tracking-wider">
                          {t.common.soldOut}
                        </span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 aspect-[4/3] md:aspect-auto md:h-[clamp(280px,48vh,560px)]">
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
        <motion.div initial={false}>
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
        initial={false}
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

