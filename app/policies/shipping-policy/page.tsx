export const metadata = {
  title: "Política de envío — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 = "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";

export default function ShippingPolicyPage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Política de envío
      </h1>

      <h2 className={H2}>Preventa</h2>
      <p>
        Todos nuestros productos se venden en preventa. Esto significa que no
        tenemos stock listo para enviar en el momento de la compra. Una vez
        cerrada la ventana de preventa, comenzamos la producción y después
        enviamos tu pedido.
      </p>
      <p>
        Tiempo estimado de entrega: 30 a 45 días desde el cierre de la
        preventa. Te avisaremos por email cuando tu pedido salga.
      </p>

      <h2 className={H2}>Tiempos de envío (tras despacho)</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>España (península): 2 a 5 días laborables</li>
        <li>Islas y zonas especiales: 3 a 7 días laborables</li>
        <li>Internacional: 5 a 15 días laborables según el país</li>
      </ul>

      <h2 className={H2}>Mensajería</h2>
      <p>Trabajamos con Correos o SEUR según el destino.</p>

      <h2 className={H2}>Coste de envío</h2>
      <p>
        El coste se calcula en el checkout en función de tu dirección de
        entrega.
      </p>

      <h2 className={H2}>Seguimiento</h2>
      <p>Recibirás un número de seguimiento por email cuando tu pedido salga.</p>
    </>
  );
}
