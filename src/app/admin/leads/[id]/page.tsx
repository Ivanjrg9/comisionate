import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { CommissionBadge } from "@/components/CommissionBadge";
import { euros } from "@/lib/format";
import type { CommissionStatus } from "@/lib/commission-status";

export const metadata: Metadata = { title: "Lead" };

export default async function AdminLeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: l } = await supabase
    .from("leads")
    .select("*, offers(title, companies(id, legal_name)), salespeople(profiles(full_name))")
    .eq("id", id)
    .single();
  if (!l) notFound();
  const [{ data: events }, { data: commissions }, { data: disputes }] = await Promise.all([
    supabase.from("lead_events").select("id, to_status, reason, created_at").eq("lead_id", id).order("id"),
    supabase.from("commissions").select("id, type, amount_cents, status").eq("lead_id", id),
    supabase.from("disputes").select("id, status, explanation, resolution").eq("lead_id", id),
  ]);
  const o = l.offers as unknown as { title: string; companies: { id: string; legal_name: string } };
  const sp = l.salespeople as unknown as { profiles: { full_name: string } };
  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/admin/leads" className="text-sm text-primary underline">← Leads</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{l.customer_name}</h1>
          <p className="text-muted">{o.title} · <Link className="underline" href={`/admin/empresas/${o.companies.id}`}>{o.companies.legal_name}</Link> · {sp.profiles.full_name}</p>
        </div>
        <StatusBadge status={l.status} />
      </header>
      {l.needs_review && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">La empresa no ha respondido en el plazo. Contacta con ella o rechaza/cualifica desde su cuenta si procede.</p>}
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[auto_1fr]">
        <dt className="font-semibold">Teléfono</dt><dd>{l.phone_e164}</dd>
        {l.sale_amount_cents != null && <><dt className="font-semibold">Importe</dt><dd>{euros(l.sale_amount_cents)}</dd></>}
      </dl>
      {!!commissions?.length && (
        <ul className="space-y-2">{commissions.map((c) => <li key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"><span>{c.type === "lead" ? "Por lead" : "Por venta"} · {euros(c.amount_cents)}</span><CommissionBadge status={c.status as CommissionStatus} /></li>)}</ul>
      )}
      {!!disputes?.length && <p className="text-sm"><Link href="/admin/disputas" className="font-semibold text-primary underline">Ver disputa</Link> ({disputes[0].status})</p>}
      <section><h2 className="mb-3 text-lg font-bold">Historial</h2><Timeline events={events ?? []} /></section>
    </div>
  );
}
