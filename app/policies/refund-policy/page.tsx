export const metadata = {
  title: "Política de reembolso — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 = "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";

export default function RefundPolicyPage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Política de reembolso
      </h1>

      <h2 className={H2}>Devoluciones y cambios</h2>
      <p>
        No aceptamos devoluciones ni cambios de talla, ya que todos los
        productos se fabrican bajo pedido a través de nuestro sistema de
        preventa.
      </p>
      <p>
        Solo aceptamos devoluciones si la prenda es defectuosa o si nos hemos
        equivocado con tu pedido.
      </p>

      <h2 className={H2}>Contacto</h2>
      <p>
        Para cualquier cuestión relacionada con devoluciones, escríbenos a{" "}
        <a
          href="mailto:chainedtosuccess@gmail.com"
          className="underline underline-offset-4 hover:text-ink"
        >
          chainedtosuccess@gmail.com
        </a>
        .
      </p>
    </>
  );
}
