export const metadata = {
  title: "Política de privacidad — VAIN",
};

const H1 = "font-display uppercase tracking-tighter leading-none text-ink";
const H2 = "font-display uppercase tracking-tight text-ink mt-10 mb-1 text-xl md:text-2xl";
const H3 = "text-ink font-medium mt-6 mb-1";

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1
        className={H1}
        style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
      >
        Política de privacidad
      </h1>
      <p className="text-sm text-ink-soft/70 mt-2">Última actualización: 8 de abril de 2026</p>

      <p>
        Esta Política de privacidad describe cómo VAIN recopila, utiliza y
        divulga información personal al visitar o utilizar nuestros servicios,
        realizar compras o comunicarse con nosotros respecto al Sitio.
      </p>

      <h2 className={H2}>Cambios en esta política</h2>
      <p>
        La política puede actualizarse para reflejar cambios en prácticas o
        razones operativas, legales o normativas. Los cambios se publicarán
        aquí con su fecha de actualización.
      </p>

      <h2 className={H2}>Recopilación y uso de tu información</h2>
      <p>
        Recopilamos información variada según cómo interactúes con nuestros
        servicios, utilizándola para comunicarnos contigo, proporcionar o
        mejorar servicios, cumplir obligaciones legales y proteger derechos.
      </p>

      <h3 className={H3}>Información que recopilamos directamente</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Datos de contacto: nombre, dirección, teléfono, correo</li>
        <li>Datos del pedido: facturación, envío, confirmación de pago</li>
        <li>Cuenta: nombre de usuario, contraseña, preguntas de seguridad</li>
        <li>Compras: artículos vistos, carrito, fidelidad, reseñas</li>
        <li>Atención al cliente: comunicaciones con nosotros</li>
      </ul>

      <h3 className={H3}>Información que recopilamos sobre tu uso</h3>
      <p>
        Recopilamos automáticamente datos de uso mediante cookies y
        tecnologías similares, incluyendo información de acceso, dispositivo,
        navegador, red e IP.
      </p>

      <h3 className={H3}>Información obtenida de terceros</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Empresas que respaldan el Sitio (como Shopify)</li>
        <li>Procesadores de pago</li>
        <li>Terceros mediante píxeles y cookies</li>
      </ul>

      <h3 className={H3}>Usos de tu información</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>Prestación de servicios: procesar pagos, preparar pedidos, mantener cuentas, gestionar devoluciones</li>
        <li>Marketing y publicidad: comunicaciones promocionales y anuncios personalizados</li>
        <li>Seguridad y prevención de fraude</li>
        <li>Atención al cliente y mejora del servicio</li>
      </ul>

      <h2 className={H2}>Cookies</h2>
      <p>
        Usamos cookies para operar el Sitio, mejorar servicios y realizar
        análisis. Puedes configurar el navegador para rechazarlas, aunque
        esto puede afectar tu experiencia. Reconocemos la señal Global
        Privacy Control (GPC) como solicitud válida de baja.
      </p>

      <h2 className={H2}>Divulgación de tu información</h2>
      <p>Divulgamos información personal en las siguientes circunstancias:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>A proveedores que prestan servicios en nuestro nombre</li>
        <li>A socios comerciales y de marketing</li>
        <li>Cuando lo solicites o consientas</li>
        <li>A afiliados para dirigir negocios</li>
        <li>Por transacciones comerciales, fusiones u obligaciones legales</li>
      </ul>

      <h2 className={H2}>Datos de menores</h2>
      <p>
        Nuestros servicios no están destinados a menores. No recopilamos
        intencionadamente información de niños. Si lo detectas, puedes
        solicitar su eliminación contactándonos. No vendemos ni compartimos
        información de menores de 16 años.
      </p>

      <h2 className={H2}>Seguridad y retención</h2>
      <p>
        Ninguna medida de seguridad es perfecta. No envíes información
        sensible por canales inseguros. La retención depende de la necesidad
        de mantener cuentas, cumplimiento legal o resolución de disputas.
      </p>

      <h2 className={H2}>Tus derechos</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Acceso, eliminación, corrección y portabilidad de tus datos</li>
        <li>Darte de baja de venta/compartición de datos o publicidad dirigida</li>
        <li>Restringir o detener el procesamiento</li>
        <li>Revocar el consentimiento</li>
        <li>Apelar decisiones de denegación</li>
        <li>Gestionar preferencias de comunicación</li>
      </ul>
      <p>
        Para ejercer tus derechos, contáctanos. No habrá discriminación por
        ejercerlos. Podemos solicitar verificación de identidad.
      </p>

      <h2 className={H2}>Usuarios internacionales</h2>
      <p>
        Tu información puede transferirse, almacenarse y procesarse fuera de
        tu país. Para transferencias fuera del EEE utilizamos Cláusulas
        Contractuales Estándar u otros mecanismos reconocidos.
      </p>

      <h2 className={H2}>Reclamaciones</h2>
      <p>
        Contáctanos por reclamaciones. Si no quedas satisfecho, puedes
        presentar reclamación ante la autoridad local de protección de
        datos.
      </p>

      <h2 className={H2}>Contacto</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Email: chainedtosuccess@gmail.com</li>
        <li>Dirección: Calle Josep Camprecios 21 principal B, 08950, España</li>
      </ul>
      <p>VAIN es responsable del tratamiento de tu información personal.</p>
    </>
  );
}
