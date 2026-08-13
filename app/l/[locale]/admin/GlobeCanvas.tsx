"use client";

import { useEffect, useRef } from "react";
import createGlobe, { type Arc, type Marker } from "cobe";
import { ORIGIN } from "@/lib/geo/country-centroids";
import type { GlobePoint } from "./globe-data";

/**
 * La esfera, calcada a la Vista en tiempo real de Shopify: globo claro, tierra
 * en puntitos y arrastre con el dedo. Todo esto es WebGL, así que vive aparte
 * del componente que trae los datos: si la GPU falla, el error boundary
 * sustituye solo esta pieza y el panel sigue en pie.
 *
 * Se usa `cobe` y no el three.js que ya hay en el proyecto por dos razones:
 * pesa 5 KB en vez de ~600 (y hoy three no se monta en ninguna página, así que
 * el panel lo arrastraría entero), y trae el mapa del mundo dentro del paquete
 * — la CSP de next.config.ts solo deja hacer fetch al propio dominio, así que
 * bajarse un GeoJSON de un CDN se bloquearía.
 *
 * Ojo con la versión: cobe 2.x NO tiene bucle de animación propio (el
 * `onRender` que sale en su README no existe en el build publicado). Cada
 * `update()` pinta un fotograma, así que el requestAnimationFrame lo llevamos
 * aquí. Y `update()` multiplica el ancho por el devicePixelRatio por su cuenta:
 * hay que pasarle píxeles CSS, no físicos, o el canvas sale al cuádruple.
 */

/** Un pedido es "reciente" (arco + latido) durante estos minutos. */
const FRESH_MS = 5 * 60_000;

/** Pedidos: el verde del panel (--color-online). */
const GREEN: [number, number, number] = [0.086, 0.639, 0.29];
/** Visitantes: tinta, para que no se confundan con los pedidos. */
const INK: [number, number, number] = [0.1, 0.1, 0.1];

/** Grados de separación por debajo de los cuales el arco es un garabato. */
const MIN_ARC_DEG = 3;

/** Cuánto persigue la rotación al dedo. Más bajo = más suave y más lento. */
const DRAG_EASING = 0.12;

/**
 * Topes del zoom. Por debajo de 1 la bola se aleja; por encima, se acerca.
 * El máximo se queda en 2.5: más cerca se pierde de vista la esfera entera y
 * ya no sabes qué trozo del mundo estás mirando.
 */
const MIN_SCALE = 0.85;
const MAX_SCALE = 2.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function GlobeCanvas({
  visitors,
  orders,
}: {
  visitors: GlobePoint[];
  orders: GlobePoint[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Los datos entran por ref y no como dependencia del efecto de abajo:
  // recrear el globo cada 10 s daría un parpadeo y perdería el ángulo de giro.
  // El bucle de dibujo lee siempre `data.current`, así que con actualizarla
  // aquí basta.
  const data = useRef({ visitors, orders });
  useEffect(() => {
    data.current = { visitors, orders };
  }, [visitors, orders]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // El globo NO gira solo: se queda donde lo dejes. La rotación persigue a
    // su objetivo con retardo, que es lo que hace que el arrastre se sienta
    // pesado como el de Shopify en vez de a tirones.
    //
    // Arranca mirando a España, que es de donde sale casi todo. Con phi = 0
    // cobe deja el globo sobre América (~85° oeste) y subir phi lo lleva aún
    // más al oeste, así que hay que restar ~80°. Medido contra los marcadores:
    // no hay fórmula, depende de cómo cobe proyecta su mapa.
    const START_PHI = -1.4;
    let phi = START_PHI;
    let phiTarget = START_PHI;
    let theta = 0.45;
    let thetaTarget = 0.45;
    let scale = 1;
    let scaleTarget = 1;

    let size = canvas.offsetWidth;
    let lastSize = 0;

    /** Dedos/punteros puestos ahora mismo, para poder pellizcar y hacer zoom. */
    const pointers = new Map<number, { x: number; y: number }>();
    /** Separación entre los dos dedos en el fotograma anterior. */
    let pinchDist: number | null = null;

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: size,
      height: size,
      phi: START_PHI,
      theta,
      // Globo azul claro con la tierra en puntos de azul más hondo. En cobe el
      // color de la tierra sale de `baseColor` modulado por `mapBrightness`,
      // no hay un ajuste aparte para ella.
      dark: 0,
      // Luz casi plana: con difusa alta sale un brillo de perla en el centro
      // que se come los puntos de esa zona. El de Shopify es igual de plano.
      diffuse: 0.08,
      mapSamples: 24000,
      mapBrightness: 2.2,
      baseColor: [0.72, 0.85, 0.97],
      markerColor: INK,
      glowColor: [0.7, 0.83, 0.96],
      arcColor: GREEN,
      arcWidth: 0.5,
      arcHeight: 0.35,
      // Sin esto los marcadores se dibujan flotando fuera de la esfera: cobe
      // no le pone valor por defecto y el shader recibe basura.
      markerElevation: 0,
      markers: [],
      arcs: [],
    });

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);

      const now = Date.now();
      const markers: Marker[] = [];
      const arcs: Arc[] = [];

      // Quien está navegando ahora: punto de tinta. El tamaño crece con la
      // gente que hay en ese país, con tope — si no, España se come la esfera.
      for (const v of data.current.visitors) {
        markers.push({
          location: [v.lat, v.lng],
          size: Math.min(0.032 + (v.weight - 1) * 0.006, 0.06),
          color: INK,
        });
      }

      // Pedidos: verde. Los de los últimos minutos laten y sueltan un arco
      // desde España; los viejos se quedan como punto fijo.
      //
      // El tamaño crece con los pedidos de ESA ciudad (los puntos vienen ya
      // agrupados, ver lib/orders-geo.ts), con tope, igual que con las visitas:
      // sin tope, mirando el histórico entero, Madrid se comería la esfera.
      for (const o of data.current.orders) {
        const size = Math.min(0.05 + (o.weight - 1) * 0.006, 0.085);
        if (now - o.t < FRESH_MS) {
          const pulse = size + 0.025 * (1 + Math.sin(now / 320));
          markers.push({ location: [o.lat, o.lng], size: pulse, color: GREEN });
          if (Math.hypot(ORIGIN[0] - o.lat, ORIGIN[1] - o.lng) > MIN_ARC_DEG) {
            arcs.push({
              from: [ORIGIN[0], ORIGIN[1]],
              to: [o.lat, o.lng],
              color: GREEN,
            });
          }
        } else {
          markers.push({ location: [o.lat, o.lng], size, color: GREEN });
        }
      }

      phi += (phiTarget - phi) * DRAG_EASING;
      theta += (thetaTarget - theta) * DRAG_EASING;
      scale += (scaleTarget - scale) * DRAG_EASING;

      // El tamaño solo se manda cuando cambia: pasarlo siempre reasignaría el
      // buffer de dibujo del canvas en cada fotograma.
      size = canvas.offsetWidth;
      const resized = size !== lastSize;
      lastSize = size;

      globe.update({
        phi,
        theta,
        scale,
        markers,
        arcs,
        ...(resized ? { width: size, height: size } : {}),
      });
    };
    raf = requestAnimationFrame(frame);

    /** Separación entre los dos primeros dedos. */
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onPointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      pinchDist = pointers.size >= 2 ? spread() : null;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        // Dos dedos: pellizco. Se deja de girar mientras se hace zoom.
        const dist = spread();
        if (pinchDist && pinchDist > 0) {
          scaleTarget = clamp(scaleTarget * (dist / pinchDist), MIN_SCALE, MAX_SCALE);
        }
        pinchDist = dist;
        return;
      }

      // Un dedo: la bola va hacia donde tiras. Dividido por el ancho, así
      // media pantalla es media vuelta mida lo que mida el globo (en el móvil
      // es bastante más pequeño). Y dividido por la escala, para que con zoom
      // el arrastre no se vuelva un salto.
      const reach = Math.max(size, 1) * Math.max(scale, 1);
      phiTarget += (dx / reach) * Math.PI;
      thetaTarget = clamp(thetaTarget + (dy / reach) * Math.PI, -0.9, 0.9);
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinchDist = pointers.size >= 2 ? spread() : null;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      if (pointers.size === 0) canvas.style.cursor = "grab";
    };

    // Rueda del ratón y pellizco del trackpad (que llega como wheel+ctrlKey).
    // passive:false porque hay que cortar el scroll de la página.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scaleTarget = clamp(
        scaleTarget * Math.exp(-e.deltaY / 900),
        MIN_SCALE,
        MAX_SCALE,
      );
    };

    /** Doble toque / doble clic: vuelta a la posición de partida. */
    const onDoubleClick = () => {
      scaleTarget = 1;
      phiTarget = START_PHI;
      thetaTarget = 0.45;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("dblclick", onDoubleClick);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("dblclick", onDoubleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      // touch-none: sin esto, arrastrar el globo en el móvil hace scroll.
      className="w-full aspect-square touch-none cursor-grab select-none"
      aria-hidden
    />
  );
}
