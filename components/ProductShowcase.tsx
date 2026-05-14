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

export default function ProductShowcase() {
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
    <section id="shop" className="bg-bone py-12 md:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 px-4 sm:px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 relative"
        >
          <div
            className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <Link
              href="/hoodies/plaid-hoodie"
              aria-label="Ver detalle Plaid Hoodie"
              className="absolute inset-0 z-0 group"
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
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </motion.div>
              ))}
              <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink/85 text-bone text-xs backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                Ver detalle
                <ArrowRight className="size-3.5" strokeWidth={2.25} />
              </span>
            </Link>

            <button
              onClick={() => setActive((a) => (a - 1 + photos.length) % photos.length)}
              aria-label="Foto anterior"
              className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-bone/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ArrowLeft className="size-4" strokeWidth={2.25} />
            </button>
            <button
              onClick={() => setActive((a) => (a + 1) % photos.length)}
              aria-label="Foto siguiente"
              className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-10 size-11 rounded-full bg-bone/90 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
            >
              <ArrowRight className="size-4" strokeWidth={2.25} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-5 flex flex-col gap-5 lg:py-8"
        >
          <span className="text-sm text-ink-soft">
            Drop/01 — Edición limitada
          </span>

          <h2
            className="font-display text-ink uppercase leading-none tracking-tighter"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)" }}
          >
            Plaid Hoodie
          </h2>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl">€39,99</span>
            <span className="line-through text-ink-soft/50 text-lg">€59,99</span>
          </div>

          <p className="text-ink-soft leading-relaxed max-w-md">
            Hoodie 450 gsm en mezcla de algodón. Forro de tela plaid en la
            capucha, bordados con detalle plaid y logo VAIN en el brazo
            izquierdo. Puños y bajo elásticos. Fit baggy cropped.
          </p>

          <ul className="text-ink-soft text-sm leading-relaxed space-y-1 list-disc pl-5 max-w-md">
            <li>450 gsm — mezcla de algodón</li>
            <li>Forro de tela plaid en la capucha</li>
            <li>Logo bordado con detalle plaid</li>
            <li>Bordado VAIN en el brazo izquierdo</li>
            <li>Puños y bajo elásticos (ribbed)</li>
            <li>Fit baggy cropped</li>
            <li>Pieza pre-made — unidades limitadas</li>
          </ul>

          <p className="text-xs text-ink-soft/70">
            Thagory mide 175 cm y lleva talla M.
          </p>

          <div className="text-sm text-ink-soft border-t border-ink/10 pt-4">
            <p className="text-ink mb-1">Envíos (una vez listo)</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>España: 2–5 días laborables</li>
              <li>Europa: 6–9 días laborables</li>
            </ul>
          </div>

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

          <Link
            href="/hoodies/plaid-hoodie"
            className="text-center text-sm text-ink-soft/70 hover:text-ink underline underline-offset-4"
          >
            Ver detalle y especificaciones
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
