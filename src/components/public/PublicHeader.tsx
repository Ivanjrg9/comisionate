import Link from "next/link";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/form";

export function PublicHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:gap-x-6">
        <Logo />
        <nav aria-label="Principal" className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {[["/ofertas", "Ofertas"], ["/como-funciona", "Cómo funciona"], ["/preguntas-frecuentes", "Preguntas frecuentes"]].map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface">{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-2 py-2 text-sm font-semibold hover:bg-surface sm:px-3">Entrar</Link>
          <Link href="/registro?rol=comercial" className={`${buttonClass} !min-h-10 !px-3 !py-2 text-sm sm:!px-4`}>Crear cuenta</Link>
        </div>
      </div>
    </header>
  );
}
