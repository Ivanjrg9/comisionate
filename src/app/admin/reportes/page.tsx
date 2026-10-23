import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateEs } from "@/lib/format";
import { ResolveReport, StartReview } from "./ReportActions";

export const metadata: Metadata = { title: "Reportes" };

const STATUS = { abierto: "Abierto", en_revision: "En revisión", resuelto: "Resuelto" } as const;

export default async function AdminReportsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reports")
    .select("id, reason, status, sanction, admin_note, created_at, target_profile_id, lead_id, reporter:reporter_id(full_name), target:target_profile_id(full_name), leads(customer_name, salespeople(id, profiles(full_name)), offers(companies(owner_id, legal_name)))")
    .order("status")
    .order("created_at", { ascending: false });
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Reportes</h1>
      {!data?.length && <p className="text-muted">No hay reportes.</p>}
      <ul className="space-y-4">
        {(data ?? []).map((r) => {
          const lead = r.leads as unknown as { customer_name: string; salespeople: { id: string; profiles: { full_name: string } }; offers: { companies: { owner_id: string; legal_name: string } } } | null;
          const targets = !r.target_profile_id && lead
            ? [{ id: lead.salespeople.id, label: `Comercial: ${lead.salespeople.profiles.full_name}` }, { id: lead.offers.companies.owner_id, label: `Empresa: ${lead.offers.companies.legal_name}` }]
            : [];
          return (
            <li key={r.id} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {(r.target as unknown as { full_name: string } | null)?.full_name ?? (lead && <Link href={`/admin/leads/${r.lead_id}`} className="underline">Venta de {lead.customer_name}</Link>)}
                </p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.status === "resuelto" ? "bg-surface" : "border border-border-strong bg-surface"}`}>{STATUS[r.status as keyof typeof STATUS]}</span>
              </div>
              <p className="text-sm text-muted">Reportado por {(r.reporter as unknown as { full_name: string }).full_name} el {dateEs(r.created_at)}</p>
              <blockquote className="border-l-4 border-border pl-3 text-sm">{r.reason}</blockquote>
              {r.status === "resuelto" ? (
                <p className="text-sm"><strong>Sanción:</strong> {r.sanction} · {r.admin_note}</p>
              ) : (
                <div className="space-y-4">
                  {r.status === "abierto" && <StartReview reportId={r.id} />}
                  <ResolveReport reportId={r.id} targets={targets} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
