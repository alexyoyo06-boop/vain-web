export const metadata = {
  title: "Información de contacto — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";

export default function ContactInformationPage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Información de contacto
      </h1>

      <p>¿Tienes dudas o algún problema con tu pedido? Escríbenos:</p>

      <ul className="list-disc pl-5 space-y-1">
        <li>
          Email:{" "}
          <a
            href="mailto:chainedtosuccess@gmail.com"
            className="underline underline-offset-4 hover:text-ink"
          >
            chainedtosuccess@gmail.com
          </a>
        </li>
        <li>
          Instagram:{" "}
          <a
            href="https://www.instagram.com/vainspn/"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-ink"
          >
            @vainspn
          </a>
        </li>
        <li>
          TikTok:{" "}
          <a
            href="https://www.tiktok.com/@vainspn"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-ink"
          >
            @vainspn
          </a>
        </li>
      </ul>

      <p>Solemos responder en 48 horas hábiles (lunes a viernes).</p>
    </>
  );
}
