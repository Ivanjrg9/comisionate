import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/public/LegalPage";
import { RULES, SITE } from "@/lib/content/site";

export const metadata: Metadata = { title: "Términos de uso para comerciales", alternates: { canonical: "/legal/terminos-comerciales" } };

export default function SalespersonTermsPage() {
  return (
    <LegalPage title="Términos de uso para comerciales">
      <p>Estos términos regulan el uso de {SITE.name} por parte de los comerciales. Al registrarte aceptas lo que sigue, junto con el <Link href="/legal/aviso-legal">Aviso legal</Link> y la <Link href="/legal/privacidad">Política de privacidad</Link>.</p>

      <h2>1. Papel de ComisionaTe y tu independencia</h2>
      <p>{SITE.name} es un <strong>intermediario</strong>: no es parte de la venta al cliente final ni responde de la instalación. Tú eres un comercial <strong>independiente</strong>: no eres empleado de la empresa ni de {SITE.name}, no tienes horarios ni mínimos, y puedes trabajar con varias empresas, sin exclusividad. El contrato de instalación es entre el cliente y la empresa.</p>

      <h2>2. Cuánto cuesta y cuánto cobras</h2>
      <p>Registrarte y usar la plataforma es <strong>gratis siempre</strong>. Cobras <strong>íntegra</strong> la comisión anunciada en la oferta: {SITE.name} nunca te descuenta nada. La tarifa de {SITE.name} la paga la empresa aparte.</p>

      <h2>3. Unirte a una oferta</h2>
      <p>Antes de unirte ves las condiciones (comisión, zona, plazos, normas) y las aceptas con un clic. Guardamos una copia con fecha y hora. Si la empresa cambia la oferta después, los cambios solo se aplican a comerciales nuevos: a ti te siguen aplicando las condiciones que aceptaste. Recibes un código de referido único por oferta. Algunas ofertas son solo para autónomos y otras requieren la aprobación de la empresa.</p>

      <h2>4. Tipos de comisión</h2>
      <p>Una oferta puede pagar una comisión por <strong>lead cualificado</strong> (se gana cuando se realiza la visita técnica), por <strong>venta</strong> (cuando el cliente firma) o ambas, en importe fijo o como porcentaje (de la venta o, en el caso del lead, del precio orientativo del producto de la oferta).</p>

      <h2>5. Ciclo de un cliente y plazos de cobro</h2>
      <ol>
        <li><strong>Registrado:</strong> registras al cliente con tu código y debes marcar que ha dado su consentimiento. La empresa tiene {RULES.respondDays} días para actualizarlo; si no lo hace, avisamos y lo revisa {SITE.name}.</li>
        <li><strong>Lead cualificado:</strong> la empresa marca que se hizo la visita técnica; si hay comisión por lead, debe pagártela en {RULES.payDays} días.</li>
        <li><strong>Venta:</strong> la empresa indica que el cliente firmó. Hay {RULES.cancelDays} días de desistimiento; si el cliente cancela en ese plazo, la comisión por venta se anula.</li>
        <li><strong>Confirmada:</strong> sin cancelación, tu comisión es firme y la empresa debe pagarla en {RULES.payDays} días más (unos 29 desde la firma). Una vez firme, si el cliente cancela después no devuelves nada, salvo que la venta se consiguiera con engaño, lo que decide {SITE.name}.</li>
        <li><strong>Pagada:</strong> la empresa te paga directamente por transferencia, lo marca y tú confirmas «Recibido» o indicas «No recibido».</li>
      </ol>
      <p>La empresa puede rechazar un lead antes de la venta siempre con un motivo.</p>

      <h2>6. Cliente reservado</h2>
      <p>Si registras a un cliente para una empresa, queda asignado a ti durante {RULES.reserveDays} días: si otro comercial intenta registrar el mismo teléfono para esa empresa, se bloquea. Si eres tú quien intenta registrar a un cliente ya reservado por otro, se bloquea el registro y se te avisa sin revelarte sus datos. Un lead rechazado libera al cliente.</p>

      <h2>7. Disputas</h2>
      <p>Si la empresa rechaza o cancela un lead y no estás de acuerdo, puedes abrir una disputa con tu explicación. {SITE.name} la resuelve: si te da la razón, el lead vuelve al estado que corresponda; si se la da a la empresa, se cierra. Puedes descargar un informe en PDF de cualquier venta (datos, estados, fechas y condiciones aceptadas) como prueba.</p>

      <h2>8. Impagos de la empresa</h2>
      <p>Si no recibes un pago una vez vencido el plazo, lo marcas como «No recibido». A los 3 días avisamos a la empresa; a los 10, segundo aviso y sus ofertas se ocultan; a los 15, lo revisa {SITE.name} y, si no se resuelve, se suspende su cuenta y se muestra la etiqueta «Empresa con pagos pendientes».</p>

      <h2>9. Normas de conducta</h2>
      <p>No puedes:</p>
      <ul>
        <li>Hacerte pasar por una compañía eléctrica o por la administración.</li>
        <li>Prometer ahorros, subvenciones o precios que la empresa no haya confirmado.</li>
        <li>Presionar a personas vulnerables.</li>
        <li>Registrar clientes sin su consentimiento o con datos falsos.</li>
        <li>Hacer llamadas en frío no autorizadas.</li>
        <li>Firmar contratos en nombre de la empresa ni cobrar dinero al cliente.</li>
      </ul>
      <p>Las sanciones, para ambas partes, son: aviso, suspensión temporal y expulsión. Las ventas conseguidas con engaño no generan comisión. Cualquier usuario puede reportar perfiles y ventas.</p>

      <h2>10. Fiscalidad</h2>
      <p>En tu perfil indicas si eres <strong>autónomo</strong> o <strong>particular</strong>. Si eres autónomo, subes tu factura de cada comisión confirmada; mostramos un desglose orientativo (comisión + IVA 21 % − IRPF 15 %, o 7 % si eres nuevo autónomo). Si eres particular, generamos un justificante de pago en PDF. Si vendes de forma habitual (más de 5 comisiones en un año natural es una señal), consulta con un gestor si debes darte de alta como autónomo. {SITE.name} no asesora fiscalmente: cada parte es responsable de sus obligaciones fiscales.</p>

      <h2>11. Datos personales de los clientes</h2>
      <p>Solo debes registrar datos reales de personas que te hayan dado su consentimiento para compartirlos con la empresa. Eres responsable de haberlo obtenido. Tu IBAN solo lo ve la empresa con la que tengas comisiones pendientes.</p>

      <h2>12. Baja</h2>
      <p>Puedes darte de baja cuando quieras: tus códigos se desactivan y conservas el derecho a cobrar todo lo que tengas en curso. La cuenta se cierra del todo cuando no queden comisiones pendientes. Tras la baja anonimizamos tus datos personales y conservamos durante 6 años los registros de ventas, pagos y facturas por obligación legal. En caso de expulsión se respetan los pagos pendientes legítimos en ambas direcciones.</p>

      <h2>13. Responsabilidad y cambios</h2>
      <p>{SITE.name} no garantiza un volumen de clientes ni de ingresos ni responde de lo que acuerden la empresa y el cliente. Podemos actualizar estos términos; los cambios relevantes se comunicarán con antelación y no afectarán a las comisiones ya generadas. Se rigen por la legislación española.</p>
    </LegalPage>
  );
}
