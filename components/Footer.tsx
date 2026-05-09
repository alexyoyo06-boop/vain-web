import { ArrowUpRight, Asterisk } from "lucide-react";

const renderPhrase = (key: string) => (
  <span
    key={key}
    className="shrink-0 inline-flex items-center font-display uppercase tracking-tighter leading-none pr-8 md:pr-12"
    style={{ fontSize: "clamp(4rem, 18vw, 18rem)" }}
  >
    VAIN
    <Asterisk
      className="ml-[0.15em] shrink-0"
      style={{ width: "0.7em", height: "0.7em" }}
      strokeWidth={1.5}
    />
  </span>
);

export default function Footer() {
  const half = Array.from({ length: 6 });

  return (
    <footer className="bg-ink text-bone rounded-t-[40px] md:rounded-t-[64px] mt-8 overflow-hidden">
      <div className="overflow-hidden py-2">
        <div className="flex animate-marquee-fast md:animate-marquee-slow whitespace-nowrap">
          <div className="flex shrink-0">
            {half.map((_, i) => renderPhrase(`a-${i}`))}
          </div>
          <div className="flex shrink-0" aria-hidden="true">
            {half.map((_, i) => renderPhrase(`b-${i}`))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-6 px-6 sm:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        <div className="md:col-span-5 flex flex-col gap-4">
          <span
            className="font-display uppercase tracking-tighter leading-none"
            style={{ fontSize: "clamp(2.4rem, 4vw, 3rem)" }}
          >
            VAIN
          </span>
          <p className="text-bone/70 text-base max-w-sm">
            Streetwear hecho en España. Drops limitados, calidad real.
          </p>
        </div>

        <div className="md:col-span-3 flex flex-col gap-3">
          <span className="text-bone/50 text-sm">Tienda</span>
          <a href="/hoodies" className="hover:text-bone transition-colors">Hoodies</a>
          <a href="#shop" className="hover:text-bone transition-colors">Drop/01</a>
          <a href="#" className="hover:text-bone transition-colors">Próximo drop</a>
          <a href="#" className="hover:text-bone transition-colors">Archivo</a>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <span className="text-bone/50 text-sm">Síguenos</span>
          <a
            href="https://www.instagram.com/v4in.shop/"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 font-display uppercase tracking-tighter leading-none hover:text-bone transition-colors"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
          >
            Instagram
            <ArrowUpRight
              aria-hidden
              className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              style={{ width: "0.7em", height: "0.7em" }}
              strokeWidth={2}
            />
          </a>
          <a
            href="https://www.tiktok.com/@v4in.com"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 font-display uppercase tracking-tighter leading-none hover:text-blood transition-colors"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}
          >
            TikTok
            <ArrowUpRight
              aria-hidden
              className="shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              style={{ width: "0.7em", height: "0.7em" }}
              strokeWidth={2}
            />
          </a>
          <a
            href="mailto:press@v4in.com"
            className="text-bone/70 hover:text-bone underline underline-offset-4"
          >
            Colabos / prensa: press@v4in.com
          </a>
        </div>
      </div>

      <div className="border-t border-bone/10 px-6 sm:px-8 py-5 flex flex-wrap justify-between items-center gap-2 text-sm text-bone/50">
        <span>© 2026 VAIN — Todos los derechos reservados.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-bone">Privacidad</a>
          <a href="#" className="hover:text-bone">Envíos</a>
          <a href="#" className="hover:text-bone">Devoluciones</a>
        </div>
      </div>
    </footer>
  );
}
