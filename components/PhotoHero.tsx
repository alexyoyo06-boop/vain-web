import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/**
 * Banner de portada: foto a sangre de lado a lado con el título, una línea de
 * apoyo y el botón encima, abajo a la izquierda. Es lo primero que se ve al
 * entrar. En móvil es una franja apaisada corta (no ocupa toda la pantalla);
 * en escritorio ocupa casi todo el alto.
 *
 * PARA CAMBIAR LA FOTO: súbela a `public/hero/` y cambia PHOTO. Tiene que ser
 * **apaisada** (~2400x1350, 16:9) porque es la misma en móvil y escritorio.
 * La mitad izquierda tiene que estar despejada y no ser blanca: ahí van el
 * texto y el botón, y si no, no se leen.
 */
const PHOTO = "/archivo/02_plaid-hoodie.jpg";

export default async function PhotoHero() {
  const { t } = await getT();

  return (
    <section className="relative w-full aspect-[16/9] md:aspect-auto md:h-[80svh] md:min-h-[560px] overflow-hidden bg-ink">
      <Image
        src={PHOTO}
        alt="VAIN"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />

      {/* Velo oscuro por la izquierda y por abajo: la foto se ve entera y el
          texto siempre se lee, caiga donde caiga el recorte. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/10 to-transparent"
      />

      <div className="absolute inset-y-0 left-0 flex flex-col items-start justify-center gap-2 md:gap-4 px-5 sm:px-8 md:px-14 md:justify-end md:pb-16">
        <h1
          className="font-display uppercase tracking-tight leading-none text-bone drop-shadow-[0_2px_12px_rgba(15,15,15,0.5)]"
          style={{ fontSize: "clamp(1.1rem, 4.2vw, 3rem)" }}
        >
          {t.nav.newDrop}
        </h1>
        <p className="text-bone/90 text-[clamp(0.7rem,2.6vw,1rem)] max-w-md leading-snug drop-shadow-[0_2px_10px_rgba(15,15,15,0.5)]">
          {t.hero.taglineLine2}
        </p>
        <Link
          href="/nuevo-drop"
          className="mt-1 inline-flex items-center justify-center px-5 py-2.5 md:px-7 md:py-3.5 rounded-full bg-bone text-ink text-[clamp(0.75rem,2.8vw,1rem)] shadow-soft hover:scale-[1.03] active:scale-[0.98] transition-transform"
        >
          {t.hero.discoverDrop}
        </Link>
      </div>
    </section>
  );
}
