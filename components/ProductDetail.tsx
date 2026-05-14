"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import FadeImage from "./FadeImage";
import MagneticButton from "./MagneticButton";

const sizes = ["XS", "S", "M", "L", "XL"];

const photos = [
  { src: "/sudadera.webp", alt: "Plaid Hoodie" },
  { src: "/vistiendola.webp", alt: "Plaid Hoodie vestida" },
  { src: "/capucha.webp", alt: "Detalle capucha" },
  { src: "/bolsillo.webp", alt: "Detalle bolsillo" },
  { src: "/suelo.jpg", alt: "Vista en el suelo" },
];

const specs = [
  ["Gramaje", "450 gsm"],
  ["Material", "Mezcla de algodón"],
  ["Fit", "Baggy cropped"],
  ["Forro capucha", "Tela plaid"],
];

export default function ProductDetail() {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(0);
  const touchStartX = useRef(0);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setActive((a) => (a + 1) % photos.length);
      else setActive((a) => (a - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section className="bg-bone py-8 md:py-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <Link
          href="/hoodies"
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors mb-6"
        >
          <ArrowLeft className="size-4" strokeWidth={2.25} />
          Volver a Hoodies
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 relative"
          >
            <div
              className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {photos.map((p, i) => (
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
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                </motion.div>
              ))}

              <button
                onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
                aria-label="Foto anterior"
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ArrowLeft className="size-4" strokeWidth={2.25} />
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % photos.length)}
                aria-label="Foto siguiente"
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
              >
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Ir a foto ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-8 bg-ink" : "w-1.5 bg-ink/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden md:flex gap-3 mt-3">
              {photos.map((p, i) => (
                <motion.button
                  key={p.src}
                  onClick={() => setActive(i)}
                  whileTap={{ scale: 0.94 }}
                  className={`relative size-20 rounded-2xl overflow-hidden transition-all ${
                    i === active ? "ring-2 ring-ink" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <FadeImage src={p.src} alt={p.alt} fill sizes="80px" className="object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-5 flex flex-col gap-4 lg:py-2">
            <span className="text-sm text-ink-soft">Drop/01 — Edición limitada</span>

            <h1
              className="font-display text-ink uppercase"
              style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", lineHeight: 1, letterSpacing: "-0.05em" }}
            >
              Plaid Hoodie
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl">€39,99</span>
              <span className="line-through text-ink-soft/50 text-lg">€59,99</span>
            </div>

            <p className="text-ink-soft leading-relaxed max-w-md">
              Hoodie 450gsm en mezcla de algodón. Forro de tela plaid en la
              capucha, bordados con detalle plaid y logo VAIN en el brazo
              izquierdo. Puños y bajo elásticos. Fit baggy cropped.
            </p>

            <div className="flex flex-col gap-3 mt-2">
              <span className="text-sm text-ink-soft">Talla</span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <motion.button
                    key={s}
                    onClick={() => setSize(s)}
                    whileTap={{ scale: 0.92 }}
                    className={`min-w-[52px] px-4 py-3 rounded-full text-sm transition-all ${
                      size === s
                        ? "bg-ink text-bone"
                        : "bg-ink/5 hover:bg-ink/10"
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>

            <MagneticButton className="w-full mt-3">
              <motion.button
                onClick={handleAdd}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className={`group w-full inline-flex items-center justify-center gap-3 px-6 py-5 rounded-full text-lg shadow-soft transition-colors ${
                  added ? "bg-bone-dim text-ink" : "bg-ink text-bone"
                }`}
              >
                <motion.span
                  key={added ? "added" : "add"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-3"
                >
                  {added ? (
                    <>
                      <Check className="size-5" strokeWidth={2.25} />
                      Añadido al carrito
                    </>
                  ) : (
                    <>
                      Añadir al carrito · talla {size}
                      <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
                    </>
                  )}
                </motion.span>
              </motion.button>
            </MagneticButton>

            <p className="text-xs text-ink-soft/70 text-center">
              Thagory mide 175 cm y lleva talla M.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-ink/10">
              {specs.map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-xs text-ink-soft">{k}</span>
                  <span className="text-base mt-0.5">{v}</span>
                </div>
              ))}
            </div>

            <details className="group mt-3 border-t border-ink/10 pt-4">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span>Detalles y materiales</span>
                <span className="size-8 rounded-full bg-ink/5 flex items-center justify-center transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <ul className="mt-3 text-sm text-ink-soft leading-relaxed space-y-1.5 list-disc pl-5">
                <li>450 gsm — mezcla de algodón</li>
                <li>Forro de tela plaid en la capucha</li>
                <li>Logo bordado con detalle plaid</li>
                <li>Bordado VAIN en el brazo izquierdo</li>
                <li>Puños y bajo elásticos (ribbed)</li>
                <li>Fit baggy cropped</li>
                <li>Pieza pre-made — unidades limitadas</li>
              </ul>
            </details>

            <details className="group border-t border-ink/10 pt-4">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span>Envíos</span>
                <span className="size-8 rounded-full bg-ink/5 flex items-center justify-center transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-3 text-sm text-ink-soft leading-relaxed space-y-2">
                <p>Una vez tu pedido esté listo:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>España: 2–5 días laborables</li>
                  <li>Europa: 6–9 días laborables</li>
                </ul>
                <p className="text-xs">
                  Más detalles en{" "}
                  <Link
                    href="/policies/shipping-policy"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    Política de envío
                  </Link>
                  .
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}
