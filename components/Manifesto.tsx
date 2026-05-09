"use client";

import { motion } from "framer-motion";

const lines = [
  ["01", "NO IMITAMOS NADA."],
  ["02", "NO ESPERAMOS PERMISO."],
  ["03", "NO HACEMOS LO BÁSICO."],
  ["04", "NO BAJAMOS LA CALIDAD."],
  ["05", "NO PARAMOS DE INVENTAR."],
];

export default function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative bg-bone border-b-2 border-ink overflow-hidden"
    >
      {/* Texto enorme detrás */}
      <p
        aria-hidden
        className="absolute -top-6 left-0 right-0 font-display uppercase whitespace-nowrap text-ink/[0.05] tracking-tighter pointer-events-none select-none"
        style={{ fontSize: "clamp(8rem, 30vw, 26rem)", lineHeight: 0.8 }}
      >
        MANIFIESTO
      </p>

      <div className="relative grid grid-cols-12 gap-6 px-4 sm:px-6 py-20 md:py-32">
        <div className="col-span-12 md:col-span-3 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-haze">
            [ §02 / DECLARACIÓN ]
          </span>
          <p className="font-display text-3xl uppercase leading-tight">
            Reglas que no van a romperse.
          </p>
          <p className="text-sm text-ink-soft mt-3">
            VAIN no es una marca, es una postura. Hecha por gente cansada
            de la moda diluida, los hoodies tristes y los drops sin alma.
          </p>
        </div>

        <ul className="col-span-12 md:col-span-9 flex flex-col gap-2 md:gap-3">
          {lines.map(([n, t], i) => (
            <motion.li
              key={n}
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="group flex items-baseline gap-4 md:gap-6 border-t-2 border-ink pt-3 md:pt-5 hover:bg-ink hover:text-bone transition-colors px-2 -mx-2"
            >
              <span className="font-mono text-xs md:text-sm uppercase tracking-[0.22em] text-haze group-hover:text-acid">
                /{n}
              </span>
              <span
                className="font-display uppercase leading-[0.95] tracking-tighter"
                style={{ fontSize: "clamp(2rem, 6vw, 5.5rem)" }}
              >
                {t}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.22em] text-haze group-hover:text-bone hidden md:inline">
                ↓ valid
              </span>
            </motion.li>
          ))}
          <li className="border-t-2 border-ink pt-4 mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-haze flex justify-between">
            <span>END / MANIFIESTO</span>
            <span>FIRMADO · VAIN HQ MADRID</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
