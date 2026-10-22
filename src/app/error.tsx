"use client";

import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/form";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <Logo />
      <h1 className="text-3xl font-extrabold">Algo ha fallado</h1>
      <p className="text-muted">No hemos podido cargar esta página. Inténtalo de nuevo; si sigue pasando, vuelve en unos minutos.</p>
      <button onClick={reset} className={buttonClass}>Reintentar</button>
    </main>
  );
}
