import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireRole("admin");
  return (
    <AppShell name={profile.full_name} roleLabel="Administración" nav={[
        { href: "/admin", label: "Resumen" },
        { href: "/admin/empresas", label: "Empresas" },
        { href: "/admin/comerciales", label: "Comerciales" },
        { href: "/admin/ofertas", label: "Ofertas" },
        { href: "/admin/leads", label: "Leads" },
        { href: "/admin/disputas", label: "Disputas" },
        { href: "/admin/reportes", label: "Reportes" },
        { href: "/admin/facturas", label: "Facturas" },
        { href: "/admin/ajustes", label: "Ajustes" },
      ]}>
      {children}
    </AppShell>
  );
}
