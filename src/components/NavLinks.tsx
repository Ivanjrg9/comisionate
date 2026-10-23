"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ items, label = "Principal" }: { items: { href: string; label: string }[]; label?: string }) {
  const pathname = usePathname();
  // El «Resumen» (ruta raíz del panel) solo está activo en su ruta exacta; el resto, en sus subrutas.
  const isActive = (href: string) => (href.split("/").length <= 2 ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  return (
    <nav aria-label={label} className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground aria-[current=page]:bg-surface aria-[current=page]:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
