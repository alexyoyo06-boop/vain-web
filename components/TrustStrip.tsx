"use client";

import { MapPin, RotateCcw, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

const items: { icon: LucideIcon; k: string; v: string }[] = [
  { icon: Truck, k: "Envío 24-48h", v: "Gratis a partir de €40" },
  { icon: RotateCcw, k: "Devoluciones gratis", v: "30 días sin preguntas" },
  { icon: MapPin, k: "Made in Spain", v: "Producción ética y local" },
];

export default function TrustStrip() {
  return (
    <section className="bg-bone py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6 max-w-6xl mx-auto">
        {items.map(({ icon: Icon, k, v }, i) => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.1 }}
            className="flex items-start gap-4 p-6 rounded-3xl bg-bone-dim/60"
          >
            <span className="size-10 rounded-full bg-ink text-bone flex items-center justify-center shrink-0">
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <div className="flex flex-col">
              <span className="font-medium">{k}</span>
              <span className="text-sm text-ink-soft">{v}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
