import type { Metadata } from "next";
import Link from "next/link";
import { RecoverForm } from "./RecoverForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecoverPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">¿Has olvidado tu contraseña?</h1>
      <p className="mb-5 text-muted">Escribe tu email y te enviaremos un enlace para elegir otra.</p>
      <RecoverForm />
      <p className="mt-6 text-center text-sm"><Link href="/login" className="text-link underline underline-offset-4">Volver a entrar</Link></p>
    </>
  );
}
