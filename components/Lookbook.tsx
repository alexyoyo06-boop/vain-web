"use client";

import { motion } from "framer-motion";

const looks = [
  { id: "01", name: "STREET / NORTH", tag: "MADRID, 04:12 AM", color: "bg-blood" },
  { id: "02", name: "TOTAL BLACK", tag: "BARCELONA, 21:08", color: "bg-ink" },
  { id: "03", name: "RAW EDIT", tag: "VALENCIA, 17:30", color: "bg-acid text-ink" },
  { id: "04", name: "AFTER HOURS", tag: "BILBAO, 03:55", color: "bg-haze" },
  { id: "05", name: "DAILY UNIFORM", tag: "SEVILLA, 12:14", color: "bg-bone-dim text-ink" },
  { id: "06", name: "OFF DUTY", tag: "MÁLAGA, 19:42", color: "bg-blood" },
];

export default function Lookbook() {
  return (
    <section id="lookbook" className="relative bg-bone border-b-2 border-ink">
      <div className="grid grid-cols-12 gap-3 px-4 sm:px-6 py-16 md:py-24">
        <div className="col-span-12 flex flex-wrap items-end justify-between gap-4 mb-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-haze">
              [ §03 / LOOKBOOK ]
            </span>
            <h2
              className="font-display uppercase leading-[0.85] tracking-tighter mt-2"
              style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
            >
              SEEN ON
              <br />
              <span className="bg-ink text-bone px-2">THE STREET.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-haze">
            <span className="size-2 rounded-full bg-acid animate-pulse" />
            06 PIEZAS · CAPTURADAS EN BRUTO
          </div>
        </div>

        <div className="col-span-12 grid grid-cols-2 md:grid-cols-3 gap-3">
          {looks.map((l, i) => (
            <motion.a
              key={l.id}
              href="#shop"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group relative aspect-[3/4] border-2 border-ink overflow-hidden block"
            >
              <div className={`absolute inset-0 ${l.color}`} />
              <div className="absolute inset-0 scanlines" />
              <div className="absolute inset-0 p-4 flex flex-col justify-between text-bone">
                <div className="flex items-start justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
                  <span>FRAME / {l.id}</span>
                  <span>{l.tag}</span>
                </div>
                <div>
                  <p
                    className="font-display uppercase leading-[0.85] tracking-tighter"
                    style={{ fontSize: "clamp(1.6rem, 4vw, 3rem)" }}
                  >
                    {l.name}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] opacity-0 group-hover:opacity-100 transition-opacity">
                    VER LOOK <span aria-hidden>→</span>
                  </div>
                </div>
              </div>
              {/* hover scribble */}
              <div className="absolute inset-0 bg-acid/0 group-hover:bg-acid/20 transition-colors" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
