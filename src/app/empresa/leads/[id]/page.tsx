import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { euros, dateEs } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { readableReason } from "@/lib/lead-status";
import { LeadActions } from "../LeadActions";

export const metadata: Metadata = { title: "Detalle del lead" };

export default async function CompanyLeadPage({ params }: PageProps<"/empresa/leads/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("*, offers(title), salespeople(fiscal, profiles(full_name)), memberships(referral_code)")
    .eq("id", id)
    .single();
  if (!lead) notFound();
  const [{ data: events }, { data: commissions }] = await Promise.all([
    supabase.from("lead_events").select("id, to_status, reason, created_at").eq("lead_id", id).order("id"),
    supabase.from("commissions").select("id, type, amount_cents, fee_cents, status, due_at").eq("lead_id", id).order("type"),
  ]);
  const offer = lead.offers as unknown as { title: string };
  const sp = lead.salespeople as unknown as { fiscal: string; profiles: { full_name: string } };
  const code = (lead.memberships as unknown as { referral_code: string }).referral_code;

  const rows: [string, React.ReactNode][] = [
    ["Teléfono", <a key="t" href={`tel:${lead.phone_e164}`} className="text-primary underline">{lead.phone_e164}</a>],
    ["Email", lead.email ?? "—"],
    ["Municipio", [lead.municipality, lead.postal_code].filter(Boolean).join(" · ") || "—"],
    ["Inmueble", lead.property_type ?? "—"],
    ["Notas del comercial", lead.notes || "—"],
    ["Registrado", dateEs(lead.created_at)],
  ];
  if (lead.sale_amount_cents != null) rows.push(["Importe de la venta", euros(lead.sale_amount_cents)]);
  if (lead.cancel_ends_at && lead.status === "periodo_cancelacion") rows.push(["Cancelación posible hasta", dateEs(lead.cancel_ends_at)]);
  if (lead.reject_reason) rows.push(["Motivo del rechazo", readableReason(lead.reject_reason + (lead.reject_note ? `: ${lead.reject_note}` : ""))!]);

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/empresa/leads" className="text-sm text-primary underline">← Volver a leads</Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{lead.customer_name}</h1>
          <p className="text-muted">{offer.title}</p>
        </div>
        <StatusBadge status={lead.status} />
      </header>

      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        {rows.map(([k, v]) => (<div key={k} className="contents"><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">{k}</dt><dd className="mb-2 sm:mb-0">{v}</dd></div>))}
        <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Traído por</dt>
        <dd className="mb-2 sm:mb-0">{sp.profiles.full_name} ({sp.fiscal === "autonomo" ? "autónomo" : "particular"}) · código {code}</dd>
      </dl>

      {!!commissions?.length && (
        <section aria-labelledby="comisiones">
          <h2 id="comisiones" className="mb-2 text-lg font-bold">Comisiones</h2>
          <ul className="space-y-2">
            {commissions.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
                <strong>{c.type === "lead" ? "Por lead" : "Por venta"}:</strong> {euros(c.amount_cents)} al comercial
                {c.fee_cents > 0 ? ` + ${euros(c.fee_cents)} para ComisionaTe` : " (sin tarifa de ComisionaTe)"} · {c.status.replace("_", " ")}
                {c.due_at && c.status === "exigible" && ` · pagar antes del ${dateEs(c.due_at)}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="acciones" className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h2 id="acciones" className="text-lg font-bold">Acciones</h2>
        <LeadActions leadId={lead.id} status={lead.status} />
      </section>

      <section aria-labelledby="historial">
        <h2 id="historial" className="mb-3 text-lg font-bold">Historial</h2>
        <Timeline events={events ?? []} />
      </section>
    </div>
  );
}
