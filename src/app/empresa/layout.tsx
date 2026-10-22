import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export default async function EmpresaLayout({ children }: LayoutProps<"/empresa">) {
  const profile = await requireRole("empresa");
  return (
    <AppShell name={profile.full_name} roleLabel="Empresa" nav={[{ href: "/empresa", label: "Resumen" }]}>
      {children}
    </AppShell>
  );
}
