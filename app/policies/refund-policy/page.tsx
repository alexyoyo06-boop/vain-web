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

      <h2 className={H2}>Derecho de desistimiento</h2>
      <p>
        Si resides en la Unión Europea, dispones de un plazo de{" "}
        <strong>14 días naturales</strong> para desistir de tu compra sin
        necesidad de justificación. Encontrarás todos los detalles y el modelo
        de formulario en nuestra{" "}
        <a
          href="/policies/withdrawal"
          className="underline underline-offset-4 hover:text-ink"
        >
          página de derecho de desistimiento
        </a>
        .
      </p>

      <h2 className={H2}>Cambios y artículos defectuosos</h2>
      <p>
        Nuestros productos se fabrican bajo pedido a través del sistema de
        preventa, por lo que no realizamos cambios de talla una vez confirmado
        el pedido. Si la prenda llega defectuosa o nos hemos equivocado con tu
        pedido, lo solucionamos sin coste para ti.
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
