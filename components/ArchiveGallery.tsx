"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import RevealText from "./RevealText";
import { useT } from "@/lib/i18n/client";

export type Shot = {
  src: string;
  alt: string;
  /** Aspect ratio override; default "3/4". Acepta "3/4", "1/1", o "WIDTHxHEIGHT". */
  aspect?: string;
  caption?: string;
};

type Props = { shots: Shot[] };

// Patrón editorial estilo magazine. Suma 24 columnas (4 filas de 6 en lg).
// Solo aspects verticales y cuadrados — las fotos de Vain (prendas y
// retratos) son siempre verticales; cualquier slot horizontal cortaría
// la prenda arriba y abajo.
type EditorialSlot = {
  colSpan: "lg:col-span-2" | "lg:col-span-3" | "lg:col-span-4";
  aspect: string;
};
const EDITORIAL_PATTERN: EditorialSlot[] = [
  // Fila 1: dos verticales grandes
  { colSpan: "lg:col-span-3", aspect: "3/4" },
  { colSpan: "lg:col-span-3", aspect: "3/4" },
  // Fila 2: hero vertical + cuadrada
  { colSpan: "lg:col-span-4", aspect: "4/5" },
  { colSpan: "lg:col-span-2", aspect: "1/1" },
  // Fila 3: tres cuadradas
  { colSpan: "lg:col-span-2", aspect: "1/1" },
  { colSpan: "lg:col-span-2", aspect: "1/1" },
  { colSpan: "lg:col-span-2", aspect: "1/1" },
  // Fila 4: cuadrada + hero vertical (espejado de la fila 2)
  { colSpan: "lg:col-span-2", aspect: "1/1" },
  { colSpan: "lg:col-span-4", aspect: "4/5" },
];

export default function ArchiveGallery({ shots }: Props) {
  const t = useT();
  return (
    <section className="bg-bone py-10 md:py-16">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 md:mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="size-4" strokeWidth={2.25} />
            {t.common.back}
          </Link>
          <p className="text-sm text-ink-soft mt-4">{t.archive.kicker}</p>
          <RevealText delay={0.1}>
            <h1
              className="font-display uppercase tracking-tighter leading-none mt-2"
              style={{ fontSize: "clamp(2.5rem, 9vw, 7rem)" }}
            >
              {t.archive.title}
            </h1>
          </RevealText>
          <p className="text-ink-soft mt-3 text-base md:text-lg max-w-2xl">
            {t.archive.description}
          </p>
        </div>

        {/* Móvil + tablet: masonry de 2 columnas, respeta aspect ratio real
            de cada foto. No cabe el patrón editorial en pantallas estrechas. */}
        <div className="columns-2 gap-3 lg:hidden">
          {shots.map((s, i) => (
            <motion.div
              key={s.src}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.55 }}
              className="break-inside-avoid mb-3"
            >
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-bone-dim shadow-soft"
                style={{ aspectRatio: s.aspect ?? "3/4" }}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
              {s.caption && (
                <p className="text-xs text-ink-soft mt-2">{s.caption}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Desktop (lg+): grid editorial estilo magazine — mezcla de
            tamaños con un patrón asimétrico que se repite. Los aspect
            ratios los manda el slot, no la foto, para mantener el ritmo. */}
        <div className="hidden lg:grid lg:grid-cols-6 lg:gap-6">
          {shots.map((s, i) => {
            const slot = EDITORIAL_PATTERN[i % EDITORIAL_PATTERN.length];
            return (
              <motion.div
                key={s.src}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.55 }}
                className={slot.colSpan}
              >
                <div
                  className="relative w-full rounded-3xl overflow-hidden bg-bone-dim shadow-soft"
                  style={{ aspectRatio: slot.aspect }}
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                {s.caption && (
                  <p className="text-sm text-ink-soft mt-2">{s.caption}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-16 md:mt-24 p-8 md:p-12 rounded-3xl bg-bone-dim/60 text-center">
          <p className="text-sm text-ink-soft mb-2">{t.archive.ctaKicker}</p>
          <p
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(1.6rem, 4vw, 2.75rem)" }}
          >
            {t.archive.ctaTitle}
          </p>
          <p className="text-ink-soft mt-3 max-w-md mx-auto">
            {t.archive.ctaBodyPre}
            <a
              href="https://www.instagram.com/vainspn/"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-ink transition-colors"
            >
              @vainspn
            </a>
            {t.archive.ctaBodyPost}
          </p>
        </div>
      </div>
    </section>
  );
}
