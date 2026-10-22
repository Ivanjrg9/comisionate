import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";

export default async function ComercialLayout({ children }: LayoutProps<"/comercial">) {
  const profile = await requireRole("comercial");
  return (
    <AppShell name={profile.full_name} roleLabel="Comercial" nav={[{ href: "/comercial", label: "Resumen" }]}>
      {children}
    </AppShell>
  );
}
