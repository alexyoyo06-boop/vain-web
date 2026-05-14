export const metadata = {
  title: "Términos del servicio — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 = "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";

export default function TermsOfServicePage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Términos del servicio
      </h1>

      <p>
        Este sitio está operado por VAIN. Al realizar un pedido, aceptas las
        siguientes condiciones:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Todos los productos se venden en preventa. Al hacer un pedido,
          aceptas que la entrega puede tardar 30 a 45 días desde el cierre de
          la preventa.
        </li>
        <li>
          Nos reservamos el derecho de cambiar precios, productos o políticas
          en cualquier momento.
        </li>
        <li>
          Todos los precios están en euros (€) e incluyen los impuestos
          aplicables.
        </li>
        <li>
          Podemos cancelar pedidos por causas razonables (sin stock, errores
          de precio, etc.).
        </li>
      </ul>

      <h2 className={H2}>Propiedad intelectual</h2>
      <p>
        Todos los diseños, imágenes y contenido de este sitio son propiedad
        de VAIN y están protegidos por copyright. Cualquier uso no
        autorizado está estrictamente prohibido.
      </p>
    </>
  );
}
