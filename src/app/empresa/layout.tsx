import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export default async function EmpresaLayout({ children }: LayoutProps<"/empresa">) {
  const profile = await requireRole("empresa");
  return (
    <AppShell name={profile.full_name} roleLabel="Empresa" nav={[
        { href: "/empresa", label: "Resumen" },
        { href: "/empresa/ofertas", label: "Ofertas" },
        { href: "/empresa/leads", label: "Leads y ventas" },
        { href: "/empresa/comisiones", label: "Comisiones" },
        { href: "/empresa/perfil", label: "Perfil" },
      ]}>
      {children}
    </AppShell>
  );
}
