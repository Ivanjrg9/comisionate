import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadForm } from "../LeadForm";

export const metadata: Metadata = { title: "Registrar cliente" };

export default async function NewLeadPage({ searchParams }: PageProps<"/comercial/leads/nuevo">) {
  const { codigo } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id, referral_code, offers!inner(title, status, companies(legal_name))")
    .eq("status", "activa")
    .eq("offers.status", "activa");
  const memberships = (data ?? []).map((m) => {
    const o = m.offers as unknown as { title: string; companies: { legal_name: string } };
    return { id: m.id, code: m.referral_code, label: `${o.title} (${o.companies.legal_name})` };
  });

  return (
    <div className="max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">Registrar cliente</h1>
      <p className="mb-6 text-muted">Tarda menos de un minuto. Solo registra a personas que te hayan dado permiso.</p>
      {memberships.length ? (
        <LeadForm memberships={memberships} defaultMembership={typeof codigo === "string" ? codigo : undefined} />
      ) : (
        <p>Necesitas un código activo. <Link href="/comercial/ofertas" className="text-link underline underline-offset-4">Únete a una oferta</Link>.</p>
      )}
    </div>
  );
}
