export const metadata = {
  title: "Aviso legal — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";

export default function LegalNoticePage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Aviso legal
      </h1>

      <p>
        En cumplimiento de la Ley 34/2002 de Servicios de la Sociedad de la
        Información y de Comercio Electrónico (LSSI), se facilita la
        siguiente información:
      </p>

      <ul className="list-disc pl-5 space-y-1">
        <li>
          <span className="text-ink font-medium">Titular:</span> VAIN
        </li>
        <li>
          <span className="text-ink font-medium">Email:</span>{" "}
          <a
            href="mailto:chainedtosuccess@gmail.com"
            className="underline underline-offset-4 hover:text-ink"
          >
            chainedtosuccess@gmail.com
          </a>
        </li>
        <li>
          <span className="text-ink font-medium">Redes sociales:</span>{" "}
          Instagram y TikTok @vainspn
        </li>
        <li>
          <span className="text-ink font-medium">Actividad:</span> Venta
          online de ropa streetwear bajo modelo de preventa.
        </li>
      </ul>

      <p>
        El sitio se estableció con fines comerciales. El uso del sitio o la
        realización de compras constituyen aceptación de los términos
        indicados.
      </p>
    </>
  );
}
