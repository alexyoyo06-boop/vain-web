"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-bone"
    >
      <div className="relative px-4 sm:px-6 pt-3 md:pt-6 pb-8 md:pb-14">
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative mx-auto select-none"
          style={{
            width: "min(80vw, 760px)",
            aspectRatio: "5 / 1.4",
            transform: `translate3d(${mouse.x * -8}px, ${mouse.y * -4}px, 0)`,
          }}
        >
          <Image
            src="/logo_index.png"
            alt="VAIN"
            fill
            priority
            sizes="(max-width: 768px) 80vw, 760px"
            className="object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-6 md:mt-10 max-w-2xl mx-auto flex flex-col items-center gap-6 text-center"
        >
          <p className="text-lg md:text-2xl text-ink-soft leading-snug">
            Streetwear hecho en España.
            <br />
            Drops limitados, calidad real.
          </p>

          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            href="#shop"
            className="group inline-flex items-center gap-3 bg-ink text-bone px-6 sm:px-8 py-4 sm:py-5 rounded-full text-sm sm:text-base md:text-lg shadow-soft hover:bg-blood transition-colors"
          >
            <span className="hidden sm:inline">Comprar Drop/01 — €39,99</span>
            <span className="sm:hidden">Comprar — €39,99</span>
            <ArrowRight aria-hidden className="size-4 sm:size-5 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
