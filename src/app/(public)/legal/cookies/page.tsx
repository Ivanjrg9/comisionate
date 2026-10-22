import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/public/LegalPage";
import { SITE } from "@/lib/content/site";

export const metadata: Metadata = { title: "Política de cookies", alternates: { canonical: "/legal/cookies" } };

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies">
      <p>Una cookie es un pequeño archivo que un sitio web guarda en tu dispositivo. {SITE.name} <strong>solo usa cookies técnicas estrictamente necesarias</strong> para que puedas iniciar sesión y usar la plataforma. No usamos cookies de analítica, publicidad ni seguimiento, por lo que no necesitamos pedirte consentimiento mediante un banner.</p>

      <h2>Cookies que usamos</h2>
      <table>
        <thead><tr><th>Cookie</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td>sb-…-auth-token</td><td>{SITE.name} (Supabase Auth)</td><td>Mantener tu sesión iniciada y renovarla de forma segura</td><td>Sesión / hasta que cierres sesión (se renueva mientras uses la plataforma)</td></tr>
        </tbody>
      </table>
      <p>También usamos el almacenamiento del navegador solo para recordar preferencias de uso que no salen de tu dispositivo.</p>

      <h2>Cómo gestionarlas</h2>
      <p>Puedes bloquear o borrar las cookies desde la configuración de tu navegador (Chrome, Safari, Firefox, Edge). Si bloqueas las cookies técnicas, no podrás iniciar sesión.</p>

      <h2>Cambios</h2>
      <p>Si en el futuro añadimos cookies que requieran consentimiento (por ejemplo, de analítica), actualizaremos esta política y te pediremos permiso antes de instalarlas. Más información en la <Link href="/legal/privacidad">Política de privacidad</Link>.</p>
    </LegalPage>
  );
}
