export const metadata = {
  title: "Derecho de desistimiento — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 = "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";

export default function WithdrawalPage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Derecho de desistimiento
      </h1>

      <h2 className={H2}>Tu derecho</h2>
      <p>
        Si resides en la Unión Europea, dispones de un plazo de{" "}
        <strong>14 días naturales</strong> para desistir de tu compra sin
        necesidad de justificación. El plazo empieza el día en que tú (o una
        persona que indiques) recibís el último artículo del pedido.
      </p>
      <p>
        Para respetar el plazo basta con que nos comuniques tu decisión de
        desistir antes de que venza.
      </p>

      <h2 className={H2}>Cómo desistir</h2>
      <p>
        Puedes solicitar el desistimiento directamente desde tu cuenta, en la
        página de tu pedido, a través del{" "}
        <a
          href="https://account.v4in.com"
          className="underline underline-offset-4 hover:text-ink"
        >
          flujo de autoservicio
        </a>
        . Solo necesitas indicar tu nombre y la referencia del pedido; recibirás
        un correo de confirmación automático.
      </p>
      <p>
        Si lo prefieres, también puedes comunicárnoslo por correo a{" "}
        <a
          href="mailto:chainedtosuccess@gmail.com"
          className="underline underline-offset-4 hover:text-ink"
        >
          chainedtosuccess@gmail.com
        </a>{" "}
        indicando tu nombre y la referencia del pedido. Te enviaremos
        confirmación de la recepción.
      </p>

      <h2 className={H2}>Efectos del desistimiento</h2>
      <p>
        Una vez ejercido el desistimiento, te reembolsaremos todos los pagos
        recibidos, incluidos los gastos de envío estándar, sin demora indebida y,
        en todo caso, antes de 14 días desde que nos comuniques tu decisión.
        Podremos retener el reembolso hasta haber recibido los artículos
        devueltos o hasta que acredites su envío.
      </p>
      <p>
        Deberás devolver los artículos sin demora indebida y, en cualquier caso,
        en un plazo máximo de 14 días desde que nos comuniques tu desistimiento.
      </p>

      <h2 className={H2}>Modelo de formulario de desistimiento</h2>
      <p>
        (Solo debes completar y enviar este formulario si deseas desistir del
        contrato.)
      </p>
      <p>
        A la atención de VAIN — chainedtosuccess@gmail.com:
        <br />
        Por la presente le comunico que desisto de mi contrato de venta del
        siguiente producto: __________
        <br />
        Pedido recibido el / con referencia: __________
        <br />
        Nombre del consumidor: __________
        <br />
        Fecha: __________
      </p>
    </>
  );
}
