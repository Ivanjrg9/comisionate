import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/public/LegalPage";
import { RULES, SITE } from "@/lib/content/site";

export const metadata: Metadata = { title: "Términos de uso para empresas", alternates: { canonical: "/legal/terminos-empresas" } };

export default function CompanyTermsPage() {
  return (
    <LegalPage title="Términos de uso para empresas">
      <p>Estos términos regulan el uso de {SITE.name} por parte de las empresas que publican ofertas. Al registrarte aceptas lo que sigue, junto con el <Link href="/legal/aviso-legal">Aviso legal</Link> y la <Link href="/legal/privacidad">Política de privacidad</Link>.</p>

      <h2>1. Papel de ComisionaTe</h2>
      <p>{SITE.name} es un <strong>intermediario</strong>. No es parte de la venta al cliente final ni responde de la instalación, del producto o de su calidad: el contrato de instalación es siempre entre el cliente y la empresa. Los comerciales son profesionales o particulares <strong>independientes</strong>: no son empleados de la empresa ni de {SITE.name}, no tienen horarios ni mínimos y pueden trabajar con varias empresas.</p>

      <h2>2. Registro y verificación</h2>
      <p>Debes facilitar datos veraces (razón social, CIF, datos de facturación). Para publicar ofertas tu empresa debe ser verificada por {SITE.name}; hasta entonces puedes preparar ofertas como borrador.</p>

      <h2>3. Ofertas y condiciones</h2>
      <p>Cada oferta define la comisión por lead cualificado (cuando se realiza la visita técnica), por venta (cuando el cliente firma) o ambas, en importe fijo o en porcentaje. Al unirse, el comercial acepta las condiciones y guardamos una copia con fecha y hora. <strong>Si cambias una oferta, los cambios solo se aplican a los comerciales que se unan después</strong>; los existentes mantienen las condiciones que aceptaron.</p>

      <h2>4. Precio del servicio</h2>
      <ul>
        <li>Registrarse y publicar ofertas es <strong>gratis</strong>, sin suscripción ni permanencia.</li>
        <li>Por cada lead o venta validada pagas la comisión del comercial <strong>más un {RULES.feePercent} %</strong> de esa comisión para {SITE.name}. Ejemplo: comisión de 500 € → 500 € al comercial y 50 € a {SITE.name}.</li>
        <li>Las empresas fundadoras no pagan ese porcentaje durante los {RULES.founderMonths} primeros meses (hasta la fecha indicada en su cuenta).</li>
        <li>{SITE.name} puede modificar el porcentaje general o fijar uno específico para tu empresa, con efecto solo sobre las comisiones que se validen a partir de la modificación y previo aviso.</li>
        <li>Los importes se indican sin IVA salvo que se indique lo contrario.</li>
      </ul>

      <h2>5. Ciclo de un lead y plazos</h2>
      <ol>
        <li><strong>Registrado:</strong> el comercial registra al cliente con su consentimiento. Tienes {RULES.respondDays} días para actualizarlo; si no lo haces te avisamos y, si sigue sin respuesta, queda marcado para revisión de {SITE.name}.</li>
        <li><strong>Lead cualificado:</strong> lo marcas cuando se ha hecho la visita técnica. Se genera la comisión por lead, que debes pagar en {RULES.payDays} días.</li>
        <li><strong>Venta:</strong> la marcas cuando el cliente firma, con el importe de la venta. Se calcula la comisión por venta y empieza un periodo de cancelación de {RULES.cancelDays} días (derecho de desistimiento).</li>
        <li><strong>Cancelada:</strong> si el cliente cancela en ese plazo, la marcas como cancelada y la comisión por venta se anula.</li>
        <li><strong>Confirmada:</strong> sin cancelación, la comisión es firme automáticamente y debes pagarla en {RULES.payDays} días más (unos 29 desde la firma). Una vez firme, si el cliente cancela después, el comercial no devuelve nada salvo que la venta se consiguiera con engaño, lo que decide {SITE.name}.</li>
        <li><strong>Rechazado:</strong> puedes rechazar un lead antes de la venta indicando siempre un motivo (cliente no interesado, datos falsos, duplicado, fuera de zona u otro, explicado).</li>
      </ol>
      <p>Cada cambio de estado queda registrado (quién, cuándo y motivo).</p>

      <h2>6. Cliente reservado</h2>
      <p>Si un cliente ya registrado para tu empresa por un comercial lo registra otro en los siguientes {RULES.reserveDays} días (mismo teléfono), el segundo registro se bloquea y el cliente queda asignado al primero. Los leads rechazados liberan al cliente.</p>

      <h2>7. Pagos</h2>
      <ul>
        <li><strong>A los comerciales:</strong> pagas la comisión directamente al comercial por transferencia, fuera de la plataforma, y la marcas como pagada. El comercial confirma que la ha recibido o indica que no.</li>
        <li><strong>A {SITE.name}:</strong> a final de cada mes emitimos una factura con la suma de la tarifa de las comisiones validadas. Debes pagarla por transferencia en {RULES.payDays} días desde su emisión.</li>
      </ul>

      <h2>8. Impagos</h2>
      <p><strong>Comisión no recibida por el comercial</strong> (desde que lo marca): a los 3 días, aviso; a los 10, segundo aviso y tus ofertas se ocultan del marketplace; a los 15, revisión de {SITE.name} y, si no se resuelve, suspensión de la cuenta y etiqueta «Empresa con pagos pendientes».</p>
      <p><strong>Factura de {SITE.name} sin pagar</strong> (desde su emisión): a los 15 días, aviso de factura vencida; a los 25, tus ofertas se ocultan y no puedes validar ventas nuevas; a los 30, la cuenta se suspende hasta que pagues. Al pagar, la cuenta se reactiva. Con tres o más impagos, {SITE.name} puede expulsarte.</p>

      <h2>9. Qué no puedes hacer</h2>
      <ul>
        <li>Rechazar ventas válidas para no pagar la comisión.</li>
        <li>Cerrar fuera de la plataforma con clientes traídos por un comercial para evitar la comisión.</li>
        <li>Retrasar pagos o dejar de responder a los leads.</li>
        <li>Cambiar condiciones a comerciales que ya las aceptaron.</li>
        <li>Facilitar información falsa o engañosa en tus ofertas.</li>
      </ul>

      <h2>10. Disputas, reportes y sanciones</h2>
      <p>Si rechazas o cancelas un lead, el comercial puede abrir una disputa y {SITE.name} la resolverá: si da la razón al comercial, el lead vuelve al estado que corresponda; si te la da a ti, se cierra. Cualquier usuario puede reportar perfiles y ventas. Las sanciones, para ambas partes, son: aviso, suspensión temporal y expulsión. Las ventas conseguidas con engaño no generan comisión.</p>

      <h2>11. Fiscalidad</h2>
      <p>Los comerciales son autónomos o particulares: los autónomos te aportan su factura (con IVA e IRPF cuando corresponda) y para los particulares la plataforma genera un justificante de pago. {SITE.name} no asesora fiscalmente y cada parte es responsable de sus obligaciones fiscales (incluida, en su caso, la retención de IRPF).</p>

      <h2>12. Datos personales</h2>
      <p>Los datos de los clientes finales los recoge el comercial con su consentimiento. Debes usarlos solo para atender esa solicitud, cumplir el RGPD y no cederlos a terceros.</p>

      <h2>13. Baja</h2>
      <p>Puedes darte de baja cuando todo esté pagado (comisiones y facturas). Tus ofertas se desactivan y avisamos a tus comerciales. Los clientes ya registrados siguen generando comisión si se convierten en venta en los {RULES.reserveDays} días siguientes. Tras la baja anonimizamos los datos personales y conservamos durante 6 años los registros de ventas, pagos y facturas por obligación legal. En caso de expulsión se respetan los pagos pendientes legítimos en ambas direcciones.</p>

      <h2>14. Responsabilidad y cambios</h2>
      <p>{SITE.name} no garantiza un volumen de leads ni de ventas ni responde de los acuerdos entre empresa, comercial y cliente. Podemos actualizar estos términos; los cambios relevantes se comunicarán con antelación y no afectarán a las comisiones ya generadas. Se rigen por la legislación española.</p>
    </LegalPage>
  );
}
