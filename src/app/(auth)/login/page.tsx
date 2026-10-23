import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, aviso, error } = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Entrar en ComisionaTe</h1>
      {aviso === "confirma-email" && (
        <p role="status" className="mb-4 rounded-xl border border-border-strong bg-surface p-3 text-sm">
          Te hemos enviado un email. Confírmalo para poder entrar.
        </p>
      )}
      {error === "enlace" && (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          El enlace ha caducado o ya se ha usado. Pide uno nuevo desde «¿Has olvidado tu contraseña?».
        </p>
      )}
      {error === "cuenta" && (
        <p role="alert" className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
          Tu cuenta no está activa (suspendida, expulsada o cerrada). Si crees que es un error, escríbenos.
        </p>
      )}
      {aviso === "baja" && (
        <p role="status" className="mb-4 rounded-xl border border-border-strong bg-surface p-3 text-sm">
          Tu cuenta se ha cerrado y tus datos personales se han anonimizado. Gracias por haber formado parte de ComisionaTe.
        </p>
      )}
      <GoogleButton label="Entrar con Google" />
      <OrDivider />
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        ¿Aún no tienes cuenta? <Link href="/registro?rol=comercial" className="text-link underline underline-offset-4">Regístrate</Link>
      </p>
    </>
  );
}
