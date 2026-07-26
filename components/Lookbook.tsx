"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Shot = { src: string };
type Props = { shots: Shot[] };

/**
 * Sección "Archivo" de la home: banda a sangre (todo el ancho) con 4 fotos —
 * **2×2 en móvil, 4 en fila en escritorio**, pegadas, sin huecos. Sin título
 * ni botón (el usuario los quitó de la home; el archivo completo con su
 * cabecera vive en /archivo). Las fotos son las de `public/lookbook/` (1..4).
 *
 * Lleva `id="top"` porque la flecha de scroll de TripletsHero apunta a #top:
 * antes ese ancla lo tenía el Hero, que ha desaparecido.
 */
export default function Lookbook({ shots }: Props) {
  const four = shots.slice(0, 4);
  if (four.length === 0) return null;

  return (
    <section id="top" className="relative bg-bone">
      {/* 2×2 en móvil, 4 en fila en escritorio, sin huecos. */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        {four.map((s, i) => (
          <motion.div
            key={s.src}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            className="relative aspect-[2/3] overflow-hidden bg-bone-dim"
          >
            <Image
              src={s.src}
              alt="VAIN"
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
