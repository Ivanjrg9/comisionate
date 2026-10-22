import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, aviso } = await searchParams;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Entrar en ComisionaTe</h1>
      {aviso === "confirma-email" && (
        <p role="status" className="mb-4 rounded-lg bg-accent/30 p-3 text-sm">
          Te hemos enviado un email. Confírmalo para poder entrar.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <p className="mt-6 text-center text-sm text-muted">
        ¿Aún no tienes cuenta? <Link href="/registro?rol=comercial" className="font-semibold text-primary underline">Regístrate</Link>
      </p>
    </>
  );
}
