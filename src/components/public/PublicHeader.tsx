import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NavLinks } from "@/components/NavLinks";
import { buttonClass } from "@/components/form";

const NAV = [
  { href: "/ofertas", label: "Ofertas" },
  { href: "/como-funciona", label: "Cómo funciona" },
  { href: "/preguntas-frecuentes", label: "Preguntas" },
];

/** Navegación flotante: lienzo oscuro con borde fino de 1px, radio 10px y sombra negra suave. */
export function PublicHeader() {
  return (
    <header className="px-4 pt-3">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-background px-4 py-2 shadow-[rgba(0,0,0,0.25)_0px_4px_4px_0px] sm:gap-x-6">
        <Logo />
        <NavLinks items={NAV} />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="inline-flex min-h-10 items-center rounded-lg border-white/10 px-2 text-sm font-medium text-muted transition hover:text-foreground sm:border sm:px-4">Entrar</Link>
          <Link href="/registro?rol=comercial" className={`${buttonClass} !min-h-10 !px-3 sm:!px-4`}>Crear cuenta</Link>
        </div>
      </div>
    </header>
  );
}
