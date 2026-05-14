"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function RevealText({ children, delay = 0, className = "" }: Props) {
  return (
    <div className={`overflow-hidden pb-[0.05em] -mb-[0.05em] ${className}`}>
      <motion.div
        initial={{ y: "108%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
