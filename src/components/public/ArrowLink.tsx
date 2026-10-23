import Link from "next/link";

/** Enlace de contenido: naranja de señal con una flecha pequeña; nunca dentro de un contenedor relleno. */
export function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-link underline-offset-4 hover:underline">
      {children}
      <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
    </Link>
  );
}
