import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export default async function ComercialLayout({ children }: LayoutProps<"/comercial">) {
  const profile = await requireRole("comercial");
  return (
    <AppShell name={profile.full_name} roleLabel="Comercial" nav={[
        { href: "/comercial", label: "Resumen" },
        { href: "/comercial/ofertas", label: "Ofertas" },
        { href: "/comercial/leads", label: "Mis clientes" },
        { href: "/comercial/comisiones", label: "Comisiones" },
        { href: "/comercial/codigos", label: "Mis códigos" },
        { href: "/comercial/perfil", label: "Perfil" },
      ]}>
      {children}
    </AppShell>
  );
}
