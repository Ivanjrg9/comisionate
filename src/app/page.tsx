import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonClass, secondaryButtonClass } from "@/components/form";

// Portada provisional: la landing completa llega en la Fase 7.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-12 text-center">
      <div className="text-3xl">
        <Logo />
      </div>
      <h1 className="text-3xl font-extrabold sm:text-4xl">Tu red de comerciales a comisión</h1>
      <p className="text-lg text-muted">
        Conectamos empresas de placas solares con comerciales independientes que cobran por cada cliente que consiguen.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/registro?rol=empresa" className={buttonClass}>Soy empresa</Link>
        <Link href="/registro?rol=comercial" className={secondaryButtonClass}>Soy comercial</Link>
      </div>
      <Link href="/login" className="text-sm font-semibold text-primary underline">Ya tengo cuenta</Link>
    </main>
  );
}
