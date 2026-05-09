"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const sizes = ["XS", "S", "M", "L", "XL"];

const photos = [
  { src: "/sudadera.webp", alt: "Plaid Hoodie" },
  { src: "/vistiendola.webp", alt: "Plaid Hoodie vestida" },
  { src: "/capucha.webp", alt: "Detalle capucha" },
  { src: "/bolsillo.webp", alt: "Detalle bolsillo" },
  { src: "/suelo.jpg", alt: "Vista en el suelo" },
];

const specs = [
  ["Material", "100% Algodón orgánico"],
  ["Gramaje", "480 gsm"],
  ["Fit", "Oversize"],
  ["Origen", "Made in Spain"],
];

export default function ProductDetail() {
  const [size, setSize] = useState("M");
  const [added, setAdded] = useState(false);
  const [active, setActive] = useState(0);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <section className="bg-bone py-8 md:py-12">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <Link
          href="/hoodies"
          className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors mb-6"
        >
          ← Volver a Hoodies
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 relative"
          >
            <div className="relative aspect-square rounded-3xl bg-bone-dim overflow-hidden shadow-soft">
              {photos.map((p, i) => (
                <motion.div
                  key={p.src}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Image
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
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 hover:bg-ink hover:text-bone backdrop-blur flex items-center justify-center transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % photos.length)}
                aria-label="Foto siguiente"
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 size-11 rounded-full bg-bone/90 hover:bg-ink hover:text-bone backdrop-blur flex items-center justify-center transition-colors"
              >
                →
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
                  <Image src={p.src} alt={p.alt} fill sizes="80px" className="object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-5 flex flex-col gap-5 lg:py-4"
          >
            <span className="text-sm text-ink-soft">Drop/01 — En stock</span>

            <h1
              className="font-display uppercase leading-[0.85] tracking-tighter"
              style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)" }}
            >
              Plaid Hoodie
            </h1>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl">€39,99</span>
              <span className="line-through text-ink-soft/50 text-lg">€59,99</span>
            </div>

            <p className="text-ink-soft leading-relaxed max-w-md">
              Hoodie pesado de 480gsm. Algodón orgánico cepillado, doble forro,
              cordones tubulares, bordado tonal en pecho. Hecho para durar
              cinco inviernos. Pensado para no pasar desapercibido.
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

            <motion.button
              onClick={handleAdd}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className={`group w-full inline-flex items-center justify-center gap-3 px-6 py-5 rounded-full text-lg shadow-soft transition-colors mt-3 ${
                added ? "bg-bone-dim text-ink" : "bg-ink text-bone hover:bg-blood"
              }`}
            >
              <motion.span
                key={added ? "added" : "add"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3"
              >
                {added ? "✓ Añadido al carrito" : `Añadir al carrito · talla ${size}`}
                {!added && (
                  <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
                )}
              </motion.span>
            </motion.button>

            <a
              href="https://v4in.com"
              target="_blank"
              rel="noreferrer"
              className="text-center text-sm text-ink-soft/70 hover:text-ink underline underline-offset-4"
            >
              Ir al checkout en v4in.com
            </a>

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
              <div className="mt-3 text-sm text-ink-soft leading-relaxed space-y-2">
                <p>
                  Sudadera con capucha de algodón orgánico cepillado por dentro
                  para máximo confort y durabilidad.
                </p>
                <p>
                  Cordones tubulares con remates metálicos. Bolsillo canguro
                  reforzado. Bordado tonal &quot;V4IN&quot; en el pecho.
                </p>
                <p>
                  Lavar a 30°. No usar lejía. No planchar el bordado.
                </p>
              </div>
            </details>

            <details className="group border-t border-ink/10 pt-4">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span>Envío y devoluciones</span>
                <span className="size-8 rounded-full bg-ink/5 flex items-center justify-center transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-3 text-sm text-ink-soft leading-relaxed space-y-2">
                <p>Envío gratis en pedidos superiores a €40. 24-48h en península.</p>
                <p>30 días para devoluciones gratis. Sin preguntas.</p>
              </div>
            </details>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
