"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de fondo (mudo, en bucle) con arranque a prueba de navegadores raros.
 *
 * POR QUÉ EXISTE: los navegadores DENTRO de las apps (TikTok, Instagram) son
 * WebViews que bloquean el autoplay aunque el vídeo esté mudo. Y en iOS, el
 * MODO DE BAJO CONSUMO lo bloquea también, en Safari normal: mucha gente lleva
 * el móvil en amarillo todo el día sin saber que eso apaga los autoplay.
 * Cuando el autoplay falla, el <video> se queda congelado en su `poster` — que
 * en la portada es la foto de los tres pantalones.
 *
 * QUÉ HACE PARA ARREGLARLO:
 *  - fuerza la PROPIEDAD muted (iOS no se fía solo del atributo);
 *  - reintenta según el vídeo va teniendo datos (loadeddata / canplay);
 *  - reintenta con CADA gesto del usuario hasta que consigue arrancar: esas
 *    WebViews y el modo de bajo consumo sí dejan reproducir si la orden sale de
 *    un gesto, así que el primer toque en cualquier sitio lo pone en marcha;
 *  - reintenta al volver de segundo plano o si el sistema lo pausa.
 *
 * OJO CON LOS REINTENTOS POR GESTO: antes se registraban con `{ once: true }`,
 * y un solo toque dispara pointerdown + touchstart + click casi a la vez — o
 * sea que ese único toque gastaba TODOS los reintentos. Si en ese instante el
 * vídeo aún no tenía datos, el play() fallaba y ya no se volvía a intentar
 * nunca: la portada se quedaba en la foto para el resto de la visita. Ahora los
 * escuchadores siguen puestos hasta que el vídeo emite `playing`, que es la
 * única señal fiable de que está reproduciendo de verdad.
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

    // El atributo `muted` del JSX no siempre basta: algunos WebViews miran la
    // propiedad, y otros `defaultMuted`. Sin esto, el navegador trata el vídeo
    // como "con sonido" y bloquea el autoplay de oficio.
    v.muted = true;
    v.defaultMuted = true;

    let started = false;

    const tryPlay = () => {
      if (started) return;
      // play() devuelve una promesa que se rompe si el navegador lo bloquea.
      // No pasa nada: seguimos escuchando gestos y eventos del vídeo.
      void v.play().catch(() => {});
    };

    // Gestos que cuentan como "el usuario ha interactuado" para las políticas
    // de autoplay. El scroll NO cuenta, por eso no está aquí.
    const GESTURES = [
      "pointerdown",
      "touchstart",
      "touchend",
      "click",
      "keydown",
    ] as const;

    const attachGestures = () => {
      for (const g of GESTURES) {
        document.addEventListener(g, tryPlay, { passive: true });
      }
    };
    const detachGestures = () => {
      for (const g of GESTURES) document.removeEventListener(g, tryPlay);
    };

    // `playing` es la señal buena: se emite cuando hay imagen moviéndose.
    // `play` a secas se dispara aunque luego el navegador lo frene.
    const onPlaying = () => {
      started = true;
      detachGestures();
    };

    // Si el sistema lo pausa (bajo consumo al bajar la batería, llamada
    // entrante, cambio de app), volvemos a armar los gestos para que el
    // siguiente toque lo reanude.
    const onPause = () => {
      started = false;
      attachGestures();
    };

    const onVisibility = () => {
      if (document.hidden) return;
      if (v.paused) {
        started = false;
        attachGestures();
        tryPlay();
      }
    };

    const MEDIA_EVENTS = ["loadeddata", "canplay", "canplaythrough"] as const;
    for (const e of MEDIA_EVENTS) v.addEventListener(e, tryPlay);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    document.addEventListener("visibilitychange", onVisibility);
    attachGestures();

    tryPlay();

    return () => {
      for (const e of MEDIA_EVENTS) v.removeEventListener(e, tryPlay);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisibility);
      detachGestures();
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
