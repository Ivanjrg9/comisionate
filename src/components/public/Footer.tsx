import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SITE } from "@/lib/content/site";

const LEGAL_LINKS = [
  ["/legal/aviso-legal", "Aviso legal"],
  ["/legal/privacidad", "Política de privacidad"],
  ["/legal/cookies", "Política de cookies"],
  ["/legal/terminos-empresas", "Términos para empresas"],
  ["/legal/terminos-comerciales", "Términos para comerciales"],
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-2">
          <Logo />
          <p className="text-muted">{SITE.tagline}.</p>
          <p className="max-w-sm text-sm text-muted">
            ComisionaTe es un intermediario: no es parte de la venta al cliente final ni responde de la instalación. Cada parte es responsable de sus obligaciones fiscales.
          </p>
        </div>
        <nav aria-label="Plataforma" className="space-y-2 text-sm">
          <p className="font-medium">Plataforma</p>
          <ul className="space-y-1">
            <li><Link className="text-muted transition hover:text-foreground" href="/ofertas">Ofertas</Link></li>
            <li><Link className="text-muted transition hover:text-foreground" href="/como-funciona">Cómo funciona</Link></li>
            <li><Link className="text-muted transition hover:text-foreground" href="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            <li><Link className="text-muted transition hover:text-foreground" href="/registro?rol=empresa">Soy empresa</Link></li>
            <li><Link className="text-muted transition hover:text-foreground" href="/registro?rol=comercial">Soy comercial</Link></li>
            <li><Link className="text-muted transition hover:text-foreground" href="/login">Entrar</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal" className="space-y-2 text-sm">
          <p className="font-medium">Legal</p>
          <ul className="space-y-1">
            {LEGAL_LINKS.map(([href, label]) => <li key={href}><Link className="text-muted transition hover:text-foreground" href={href}>{label}</Link></li>)}
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">© {new Date().getFullYear()} {SITE.name} · {SITE.domain}</p>
    </footer>
  );
}
