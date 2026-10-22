import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/public/LegalPage";
import { LEGAL, SITE } from "@/lib/content/site";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/legal/privacidad" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad">
      <p>Explicamos qué datos personales tratamos en {SITE.name}, para qué, durante cuánto tiempo y qué derechos tienes, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).</p>

      <h2>1. Responsable del tratamiento</h2>
      <p>{LEGAL.entity}, con CIF/NIF {LEGAL.taxId} y domicilio en {LEGAL.address}. Contacto para cuestiones de privacidad: {LEGAL.email}.</p>

      <h2>2. Qué datos tratamos y para qué</h2>
      <table>
        <thead><tr><th>Datos</th><th>Finalidad</th><th>Base jurídica</th></tr></thead>
        <tbody>
          <tr><td>Cuenta: nombre, email, contraseña (cifrada), rol, teléfono</td><td>Crear y gestionar tu cuenta, comunicarnos contigo y enviarte avisos del servicio</td><td>Ejecución del contrato</td></tr>
          <tr><td>Comerciales: DNI/NIE, situación fiscal (autónomo o particular), IBAN, zona, experiencia, foto</td><td>Identificar al perceptor, generar justificantes y facturas, permitir el pago de comisiones (el IBAN solo lo ve la empresa con comisiones pendientes con ese comercial)</td><td>Ejecución del contrato y obligación legal</td></tr>
          <tr><td>Empresas: razón social, CIF, datos de facturación, logotipo</td><td>Verificar la empresa, publicar ofertas y emitir facturas</td><td>Ejecución del contrato y obligación legal</td></tr>
          <tr><td>Clientes finales (registrados por un comercial): nombre, teléfono, email, municipio, tipo de inmueble, notas</td><td>Ponerlos en contacto con la empresa para presupuestar una instalación y calcular la comisión</td><td>Consentimiento del cliente, recogido por el comercial</td></tr>
          <tr><td>Uso de la plataforma: historial de estados, pagos, disputas, reportes, valoraciones</td><td>Gestionar el servicio, resolver conflictos y prevenir el fraude</td><td>Ejecución del contrato e interés legítimo</td></tr>
          <tr><td>Datos técnicos mínimos (cookies de sesión, dirección IP en registros de servidor)</td><td>Seguridad y funcionamiento</td><td>Interés legítimo</td></tr>
        </tbody>
      </table>
      <p><strong>Clientes finales:</strong> el comercial que registra a un cliente declara que este le ha dado su consentimiento para compartir sus datos con la empresa. Los datos del cliente solo los ven la empresa de esa venta, el comercial que lo registró y el equipo de {SITE.name} cuando es necesario para resolver una incidencia. No los usamos con fines comerciales propios.</p>

      <h2>3. Destinatarios</h2>
      <ul>
        <li>La empresa y el comercial que participan en una misma venta, en lo necesario para el servicio.</li>
        <li>Proveedores tecnológicos que actúan como encargados del tratamiento: alojamiento y base de datos (Supabase), despliegue (Vercel) y envío de correos electrónicos (Resend). Pueden implicar transferencias internacionales amparadas en cláusulas contractuales tipo u otras garantías adecuadas.</li>
        <li>Administraciones públicas cuando exista obligación legal.</li>
      </ul>

      <h2>4. Conservación</h2>
      <p>Conservamos los datos mientras tengas cuenta. Cuando te das de baja anonimizamos tus datos personales (nombre, contacto, DNI/NIE, IBAN, foto y los datos de los clientes finales vinculados). Conservamos durante <strong>6 años</strong>, bloqueados y sin usarlos para otros fines, los registros de ventas, pagos y facturas que exige la normativa mercantil y fiscal.</p>

      <h2>5. Tus derechos</h2>
      <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a {LEGAL.email}. Puedes retirar tu consentimiento en cualquier momento. Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).</p>

      <h2>6. Seguridad</h2>
      <p>Aplicamos medidas técnicas y organizativas adecuadas: contraseñas cifradas, comunicaciones seguras (HTTPS), control de acceso por rol y reglas de seguridad a nivel de fila en la base de datos, de modo que cada usuario solo accede a los datos que le corresponden.</p>

      <h2>7. Cookies y cambios</h2>
      <p>Consulta la <Link href="/legal/cookies">Política de cookies</Link>. Si modificamos esta política, publicaremos la nueva versión aquí e informaremos de los cambios relevantes.</p>
    </LegalPage>
  );
}
