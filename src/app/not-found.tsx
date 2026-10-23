import Link from "next/link";
import { buttonClass } from "@/components/form";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <Logo />
      <h1 className="text-3xl font-semibold">No encontramos esa página</h1>
      <p className="text-muted">El enlace puede estar mal escrito o la página ya no existe.</p>
      <Link href="/" className={buttonClass}>Ir al inicio</Link>
    </main>
  );
}
