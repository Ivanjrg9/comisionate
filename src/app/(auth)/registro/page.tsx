import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { GoogleButton, OrDivider } from "@/components/GoogleButton";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: PageProps<"/registro">) {
  const { rol } = await searchParams;
  const role = rol === "empresa" ? "empresa" : "comercial";
  const tab = (target: string, label: string) => (
    <Link
      href={`/registro?rol=${target}`}
      aria-current={role === target ? "page" : undefined}
      className={`flex-1 rounded-lg px-3 py-2 text-center font-semibold ${role === target ? "bg-primary text-primary-foreground" : "hover:bg-background"}`}
    >
      {label}
    </Link>
  );
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Crea tu cuenta gratis</h1>
      <nav aria-label="Tipo de cuenta" className="mb-5 flex gap-2 rounded-xl bg-background p-1">
        {tab("comercial", "Soy comercial")}
        {tab("empresa", "Soy empresa")}
      </nav>
      {role === "comercial" && (
        <>
          <GoogleButton label="Registrarme con Google" />
          <OrDivider />
        </>
      )}
      <RegisterForm key={role} role={role} />
      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta? <Link href="/login" className="text-link underline underline-offset-4">Entrar</Link>
      </p>
    </>
  );
}
