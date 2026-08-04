"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de fondo (mudo, en bucle) con arranque a prueba de navegadores raros.
 *
 * POR QUÉ EXISTE: los navegadores DENTRO de las apps (TikTok, Instagram) son
 * WebViews que bloquean el autoplay aunque el vídeo esté mudo. Cuando el
 * autoplay falla, el <video> se queda congelado en su `poster` — que en la
 * portada es la foto de los tres pantalones. Quien entraba desde un chat de
 * TikTok veía la foto fija y nunca el vídeo.
 *
 * QUÉ HACE PARA ARREGLARLO:
 *  - fuerza la PROPIEDAD muted (iOS no se fía solo del atributo);
 *  - reintenta al tener datos suficientes (`canplay`);
 *  - reintenta al PRIMER toque o click en cualquier sitio de la página: esas
 *    WebViews sí dejan reproducir si la orden sale de un gesto del usuario;
 *  - reintenta al volver de segundo plano.
 *
 * Si aun así no reproduce, se ve el póster: nunca queda un hueco negro.
 */
export default function AutoVideo({
  src,
  poster,
  className,
}: {
  src: string;
  poster?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const tryPlay = () => {
      v.play().catch(() => {});
    };
    tryPlay();
    v.addEventListener("canplay", tryPlay);
    // `pointerdown` cubre ratón y dedo; `touchstart` va aparte porque algunas
    // WebViews de Android no emiten eventos de puntero.
    const kick = () => tryPlay();
    const gestures = ["pointerdown", "touchstart", "click"] as const;
    for (const g of gestures) {
      document.addEventListener(g, kick, { once: true, passive: true });
    }
    const onVis = () => {
      if (!document.hidden) tryPlay();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      v.removeEventListener("canplay", tryPlay);
      for (const g of gestures) document.removeEventListener(g, kick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
      className={className}
    />
  );
}
