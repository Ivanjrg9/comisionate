import Link from "next/link";
import { RULES } from "@/lib/content/site";

/** Barra de anuncio superior: franja #171717 con bordes finos, texto centrado de 14px/600 y un enlace discreto. */
export function AnnouncementBar() {
  return (
    <div className="border-b border-border bg-surface">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 px-4 py-2 text-center text-sm">
        <span className="font-semibold"><span className="sm:hidden">Empresas fundadoras: {RULES.founderMonths} meses sin tarifa</span><span className="hidden sm:inline">Empresas fundadoras: {RULES.founderMonths} meses sin la tarifa del {RULES.feePercent} %</span></span>
        <Link href="/registro?rol=empresa" className="text-muted transition hover:text-foreground">Registrar mi empresa</Link>
      </p>
    </div>
  );
}
