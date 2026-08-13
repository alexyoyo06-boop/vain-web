import Link from "next/link";
import AutoVideo from "@/components/AutoVideo";
import { getDictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/config";
import { HERO_POSTER, HERO_VIDEO } from "@/lib/media";

/**
 * Banner de portada: vídeo a sangre de lado a lado con el título, una línea de
 * apoyo y el botón encima, abajo a la izquierda. Es lo primero que se ve al
 * entrar. En móvil es una franja apaisada corta (no ocupa toda la pantalla);
 * en escritorio ocupa casi todo el alto.
 *
 * PARA CAMBIAR EL VÍDEO: se sube al CDN de Shopify y se cambia la URL en
 * `lib/media.ts` (ahí están las instrucciones y el motivo de no tenerlo en
 * public/). Tiene que ser **apaisado** (16:9, p. ej. 1280x720) porque es el
 * mismo en móvil y escritorio. La mitad izquierda tiene que estar despejada y
 * no ser blanca: ahí van el texto y el botón, y si no, no se leen. Va sin
 * sonido, en bucle y arranca solo (así lo permiten los navegadores en móvil).
 *
 * POSTER = imagen fija que se ve mientras carga el vídeo (y si no reproduce).
 * El arranque lo lleva AutoVideo, que reintenta cuando el navegador de dentro
 * de TikTok o Instagram bloquea el autoplay (si no, se quedaba en el póster).
 */
const VIDEO = HERO_VIDEO;
const POSTER = HERO_POSTER;

export default async function PhotoHero({
  locale,
  video = VIDEO,
  poster = POSTER,
}: {
  // El idioma llega por prop desde la página. Antes lo leía él solo de la
  // cookie, y eso volvía dinámica cualquier página que lo montara.
  locale: Locale;
  video?: string;
  poster?: string;
}) {
  const t = await getDictionary(locale);

  return (
    // El margen negativo mete el vídeo por debajo de la barra (84px en móvil,
    // 100 en escritorio) para que la barra flote encima y se funda con él.
    // Si cambia el alto de la barra en Nav.tsx, hay que cambiarlo aquí.
    <section className="relative w-full -mt-[84px] md:-mt-[100px] h-[calc(56.25vw+84px)] md:h-[80svh] md:min-h-[560px] overflow-hidden bg-ink">
      <AutoVideo
        src={video}
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
      />

      {/* Velo oscuro por la izquierda y por abajo: la foto se ve entera y el
          texto siempre se lee, caiga donde caiga el recorte. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/10 to-transparent"
      />

      {/* Velo por arriba: la barra va fundida con la foto y en blanco, así que
          necesita algo oscuro detrás o el logo se pierde sobre la piedra clara. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-28 md:h-36 bg-gradient-to-b from-ink/45 to-transparent"
      />

      {/* Degradado al crema por abajo: la foto se funde con la página en vez
          de cortar con una línea recta contra la sección de los triplets. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3 md:h-4 bg-gradient-to-t from-bone to-transparent"
      />

      {/* pb-20 en escritorio: el texto se queda por encima del degradado de
          abajo, si no el botón crema se pierde sobre el crema. */}
      <div className="absolute inset-y-0 left-0 flex flex-col items-start justify-center gap-2 md:gap-4 px-5 sm:px-8 md:px-14 pt-[84px] md:pt-0 md:justify-end md:pb-20">
        <h1
          className="font-display uppercase tracking-tight leading-none text-bone drop-shadow-[0_2px_12px_rgba(15,15,15,0.5)]"
          style={{ fontSize: "clamp(1.1rem, 4.2vw, 3rem)" }}
        >
          {t.nav.newDrop}
        </h1>
        {/* Mismo tratamiento que las píldoras de la barra fundida: translúcido
            en blanco. Sobre foto, un botón sólido rompe el efecto de capa. */}
        <Link
          href="/nuevo-drop"
          className="mt-1 inline-flex items-center justify-center px-5 py-2.5 md:px-7 md:py-3.5 rounded-full bg-bone/20 hover:bg-bone/30 text-bone backdrop-blur-sm text-[clamp(0.75rem,2.8vw,1rem)] hover:scale-[1.03] active:scale-[0.98] transition-all"
        >
          {t.hero.newDropShort}
        </Link>
      </div>
    </section>
  );
}
