"use client";

// Fallback CSS del logo VAIN si WebGL falla o el GLB no carga.
// Muestra el PNG plano con los colores originales — sin sheen cromo
// (que era el efecto que pedimos quitar). Es lo que se ve en mobile
// viejos / GPUs bloqueadas mientras el 3D no arranca.

import Image from "next/image";

export default function MetallicLogo() {
  return (
    <div className="relative w-full max-w-[380px] md:max-w-[460px] mx-auto select-none">
      <div className="relative w-full aspect-square">
        <Image
          src="/logo_en3d.png"
          alt="VAIN"
          fill
          priority
          sizes="(max-width: 768px) 80vw, 460px"
          draggable={false}
          className="object-contain pointer-events-none"
        />
      </div>
    </div>
  );
}
