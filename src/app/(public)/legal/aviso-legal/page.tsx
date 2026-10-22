import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/public/LegalPage";
import { LEGAL, SITE } from "@/lib/content/site";

export const metadata: Metadata = { title: "Aviso legal", alternates: { canonical: "/legal/aviso-legal" } };

export default function LegalNoticePage() {
  return (
    <LegalPage title="Aviso legal">
      <h2>1. Titular del sitio web</h2>
      <p>En cumplimiento de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de que el titular de {SITE.domain} y de la plataforma {SITE.name} es:</p>
      <ul>
        <li>Denominación social: {LEGAL.entity}</li>
        <li>CIF/NIF: {LEGAL.taxId}</li>
        <li>Domicilio: {LEGAL.address}</li>
        <li>Inscripción: {LEGAL.registry}</li>
        <li>Contacto: {LEGAL.email}</li>
      </ul>

      <h2>2. Objeto</h2>
      <p>{SITE.name} es una plataforma web que pone en contacto a empresas que quieren vender más (inicialmente, instalación de placas solares y autoconsumo fotovoltaico) con comerciales independientes que consiguen clientes a cambio de una comisión. {SITE.name} actúa únicamente como <strong>intermediario</strong>: no es parte del contrato entre la empresa y el cliente final ni responde de la instalación o del producto.</p>

      <h2>3. Condiciones de uso</h2>
      <p>El acceso a la parte pública es libre y gratuito. El uso de las áreas privadas exige registro y la aceptación de los <Link href="/legal/terminos-empresas">Términos para empresas</Link> o de los <Link href="/legal/terminos-comerciales">Términos para comerciales</Link>, según el caso. El usuario se compromete a usar la plataforma de buena fe, con datos veraces y conforme a la ley y a las normas de conducta.</p>

      <h2>4. Propiedad intelectual e industrial</h2>
      <p>Los contenidos, el diseño, el código, los textos, los logotipos y la marca {SITE.name} pertenecen a su titular o cuenta con licencia para su uso. No se permite su reproducción, distribución o transformación sin autorización expresa. Los contenidos que suben los usuarios (logotipos, materiales de venta) siguen siendo de su titular, que concede a {SITE.name} la licencia necesaria para mostrarlos en la plataforma.</p>

      <h2>5. Responsabilidad</h2>
      <p>{SITE.name} no garantiza la disponibilidad continuada del servicio ni se hace responsable de los daños derivados de interrupciones, errores o virus ajenos a su control. Tampoco responde de la veracidad de la información que publican empresas y comerciales, ni de los acuerdos que alcancen entre sí, ni de los pagos que se realicen fuera de la plataforma. {SITE.name} no asesora fiscal, laboral ni legalmente: cada parte es responsable de sus obligaciones.</p>

      <h2>6. Enlaces</h2>
      <p>La plataforma puede contener enlaces a sitios de terceros (por ejemplo, la web de una empresa). {SITE.name} no controla ni responde de sus contenidos.</p>

      <h2>7. Protección de datos y cookies</h2>
      <p>El tratamiento de datos personales se rige por la <Link href="/legal/privacidad">Política de privacidad</Link> y el uso de cookies por la <Link href="/legal/cookies">Política de cookies</Link>.</p>

      <h2>8. Legislación y jurisdicción</h2>
      <p>Este aviso se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que correspondan conforme a la normativa aplicable; si el usuario es consumidor, a los de su domicilio.</p>
    </LegalPage>
  );
}
