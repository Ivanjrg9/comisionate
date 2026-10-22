import Link from "next/link";
import { Logo } from "@/components/Logo";
import { secondaryButtonClass } from "@/components/form";
import { NotificationBell } from "@/components/NotificationBell";

export function AppShell({
  name,
  roleLabel,
  nav,
  children,
}: {
  name: string;
  roleLabel: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo />
          <nav aria-label="Principal" className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-background">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <NotificationBell />
            <span className="hidden sm:inline">
              {name} · <span className="text-muted">{roleLabel}</span>
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className={`${secondaryButtonClass} !min-h-9 !px-3 !py-1`}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}
