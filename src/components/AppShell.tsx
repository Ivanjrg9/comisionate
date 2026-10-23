import { Logo } from "@/components/Logo";
import { secondaryButtonClass } from "@/components/form";
import { NotificationBell } from "@/components/NotificationBell";
import { NavLinks } from "@/components/NavLinks";

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
      <header className="px-4 pt-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-background px-4 py-2 shadow-[rgba(0,0,0,0.25)_0px_4px_4px_0px]">
          <Logo />
          <NavLinks items={nav} />
          <div className="ml-auto flex items-center gap-2 text-sm">
            <NotificationBell />
            <span className="hidden text-muted lg:inline">
              <span className="text-foreground">{name}</span> · {roleLabel}
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className={`${secondaryButtonClass} !min-h-9 !px-3 !py-1`}>
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
