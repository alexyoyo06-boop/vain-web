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
    // El navegador ha demostrado que solo sabe reproducir a pantalla completa.
    // Una vez marcado, no se vuelve a intentar en toda la visita.
    let rendido = false;

    /**
     * Navegadores DENTRO de apps que no saben reproducir vídeo incrustado.
     *
     * En ellos no hay término medio: o pantalla completa, o nada. Como abrir la
     * pantalla completa encima de la tienda no es aceptable, aquí NI SE INTENTA
     * reproducir — se queda el póster, que es la foto de los pantalones, que es
     * exactamente lo que veían estos visitantes antes de todo esto.
     *
     * El guardia de `onFullscreen` de abajo sigue puesto para el resto del
     * mundo: esta lista solo evita el fogonazo de pantalla completa en los
     * casos que ya sabemos rotos, en vez de abrirla y cerrarla al instante.
     * Cualquier otro navegador que se porte igual cae en el guardia.
     */
    const SIN_VIDEO_INCRUSTADO =
      /BytedanceWebview|musical_ly|TikTok|Instagram|FB_IAB|FBAN|FBAV/i;
    if (SIN_VIDEO_INCRUSTADO.test(navigator.userAgent)) {
      rendido = true;
    }

    const tryPlay = () => {
      if (started || rendido) return;
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
    // siguiente toque lo reanude. Salvo que nos hayamos rendido: ahí el
    // pause lo hemos provocado nosotros al salir de pantalla completa, y
    // rearmar montaría un bucle (toque → pantalla completa → salir → toque…).
    const onPause = () => {
      if (rendido) return;
      started = false;
      attachGestures();
    };

    const onVisibility = () => {
      if (document.hidden || rendido) return;
      if (v.paused) {
        started = false;
        attachGestures();
        tryPlay();
      }
    };

    /**
     * PANTALLA COMPLETA: el bug de entrar desde TikTok.
     *
     * El navegador de dentro de TikTok (y el de Instagram, y iOS con ciertos
     * ajustes) no permite vídeo incrustado: cuando la app anfitriona no activa
     * la reproducción en línea, `playsinline` se ignora y CUALQUIER play() que
     * prospere abre el vídeo a pantalla completa, tapando la tienda entera.
     *
     * Antes esto se veía poco porque el arranque casi nunca prosperaba. Al
     * hacer que reintente con cada gesto, empezó a prosperar siempre — y con
     * él la pantalla completa. Así que aquí se detecta, se sale, y se deja de
     * intentar para el resto de la visita: es preferible el póster fijo (la
     * foto de los pantalones) a secuestrarle la pantalla a quien venía a
     * comprar.
     */
    const enPantallaCompleta = (): boolean => {
      const el = v as HTMLVideoElement & { webkitDisplayingFullscreen?: boolean };
      return Boolean(el.webkitDisplayingFullscreen) || document.fullscreenElement === v;
    };

    const onFullscreen = () => {
      if (!enPantallaCompleta()) return;
      rendido = true;
      detachGestures();
      const el = v as HTMLVideoElement & { webkitExitFullscreen?: () => void };
      try {
        el.webkitExitFullscreen?.();
        if (document.fullscreenElement === v) void document.exitFullscreen?.();
      } catch {
        // Si no deja salir, al menos ya no se vuelve a lanzar.
      }
      v.pause();
    };

    const MEDIA_EVENTS = ["loadeddata", "canplay", "canplaythrough"] as const;
    // `webkitbeginfullscreen` es el de iOS/WebKit, que es donde pasa esto;
    // `fullscreenchange` cubre el estándar por si acaso.
    const FULLSCREEN_EVENTS = ["webkitbeginfullscreen", "fullscreenchange"] as const;

    // El guardia de pantalla completa se pone SIEMPRE, incluso en los
    // navegadores ya descartados: si alguno consigue abrirla por su cuenta,
    // se cierra igual.
    for (const e of FULLSCREEN_EVENTS) v.addEventListener(e, onFullscreen);

    if (!rendido) {
      for (const e of MEDIA_EVENTS) v.addEventListener(e, tryPlay);
      v.addEventListener("playing", onPlaying);
      v.addEventListener("pause", onPause);
      document.addEventListener("visibilitychange", onVisibility);
      attachGestures();
      tryPlay();
    }

    return () => {
      for (const e of MEDIA_EVENTS) v.removeEventListener(e, tryPlay);
      for (const e of FULLSCREEN_EVENTS) v.removeEventListener(e, onFullscreen);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      document.removeEventListener("visibilitychange", onVisibility);
      detachGestures();
    };
  }, [src]);

  // Atributos que React no conoce pero que miran los WebViews para NO abrir el
  // vídeo a pantalla completa: `webkit-playsinline` es el de iOS anterior a
  // `playsinline`, y `x5-playsinline` el del motor X5 (WeChat, navegadores
  // chinos). Van por spread porque el tipado de <video> no los contempla.
  const inlineAttrs = {
    "webkit-playsinline": "true",
    "x5-playsinline": "true",
  } as const;

  return (
    <video
      ref={videoRef}
      {...inlineAttrs}
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
