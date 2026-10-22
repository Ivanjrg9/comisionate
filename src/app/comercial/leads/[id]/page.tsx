import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateEs, euros } from "@/lib/format";
import { readableReason } from "@/lib/lead-status";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";

export const metadata: Metadata = { title: "Detalle del cliente" };

const NEXT_STEP: Record<string, string> = {
  registrado: "La empresa tiene 15 días para contactar con el cliente y hacer la visita técnica.",
  lead_cualificado: "La visita técnica ya se ha hecho. Si hay comisión por lead, la empresa debe pagarla en 15 días.",
  periodo_cancelacion: "El cliente firmó. Hay 14 días de desistimiento; después tu comisión por venta será firme.",
  confirmada: "Comisión firme. La empresa debe pagarla en 15 días.",
  pagada: "Todo cobrado. ¡Enhorabuena!",
};

export default async function SalespersonLeadPage({ params, searchParams }: PageProps<"/comercial/leads/[id]">) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const supabase = await createClient();
  const { data: lead } = await supabase.from("leads").select("*, offers(title, companies(legal_name))").eq("id", id).single();
  if (!lead) notFound();
  const [{ data: events }, { data: commissions }] = await Promise.all([
    supabase.from("lead_events").select("id, to_status, reason, created_at").eq("lead_id", id).order("id"),
    supabase.from("commissions").select("id, type, amount_cents, status, due_at").eq("lead_id", id).order("type"),
  ]);
  const offer = lead.offers as unknown as { title: string; companies: { legal_name: string } };

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/comercial/leads" className="text-sm text-primary underline">← Mis clientes</Link>
      {nuevo && <p role="status" className="rounded-lg bg-primary/15 p-3 font-medium">Cliente registrado. La empresa ya ha recibido el aviso.</p>}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{lead.customer_name}</h1>
          <p className="text-muted">{offer.title} · {offer.companies.legal_name}</p>
        </div>
        <StatusBadge status={lead.status} />
      </header>
      {NEXT_STEP[lead.status] && <p>{NEXT_STEP[lead.status]}</p>}
      {(lead.status === "rechazado" || lead.status === "cancelada") && (
        <p className="rounded-lg bg-danger/10 p-3 text-sm">
          {lead.reject_reason ? `Motivo: ${readableReason(lead.reject_reason + (lead.reject_note ? `: ${lead.reject_note}` : ""))}. ` : ""}
          Si crees que no es correcto, podrás abrir una disputa (próximamente).
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Teléfono</dt><dd className="mb-2 sm:mb-0">{lead.phone_e164}</dd>
        <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Municipio</dt><dd className="mb-2 sm:mb-0">{[lead.municipality, lead.postal_code].filter(Boolean).join(" · ") || "—"}</dd>
        <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Registrado</dt><dd className="mb-2 sm:mb-0">{dateEs(lead.created_at)}</dd>
        {lead.cancel_ends_at && <><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Periodo de cancelación hasta</dt><dd className="mb-2 sm:mb-0">{dateEs(lead.cancel_ends_at)}</dd></>}
      </dl>
      {!!commissions?.length && (
        <section aria-labelledby="comisiones">
          <h2 id="comisiones" className="mb-2 text-lg font-bold">Tus comisiones</h2>
          <ul className="space-y-2">
            {commissions.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
                <strong>{c.type === "lead" ? "Por lead" : "Por venta"}:</strong> {euros(c.amount_cents)} · {c.status.replace("_", " ")}
                {c.due_at && c.status === "exigible" && ` · la empresa debe pagar antes del ${dateEs(c.due_at)}`}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="historial">
        <h2 id="historial" className="mb-3 text-lg font-bold">Historial</h2>
        <Timeline events={events ?? []} />
      </section>
    </div>
  );
}
