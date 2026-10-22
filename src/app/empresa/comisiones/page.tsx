import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CommissionBadge } from "@/components/CommissionBadge";
import { Stat } from "@/components/Stat";
import type { CommissionStatus } from "@/lib/commission-status";
import { dateEs, euros, isPast } from "@/lib/format";
import { MarkPaid } from "./MarkPaid";

export const metadata: Metadata = { title: "Comisiones" };

const OPEN: CommissionStatus[] = ["exigible", "no_recibida", "pagada_empresa"];

export default async function CompanyCommissionsPage() {
  const supabase = await createClient();
  const { data: commissions, error } = await supabase
    .from("commissions")
    .select("id, type, amount_cents, fee_cents, status, due_at, lead_id, salesperson_id, leads(customer_name, offers(title)), salespeople(fiscal, profiles(full_name)), salesperson_invoices(id)")
    .neq("status", "anulada")
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  const all = commissions ?? [];

  // IBAN: solo se muestra mientras haya algo pendiente con ese comercial (lo controla la base de datos).
  const toPay = [...new Set(all.filter((c) => OPEN.includes(c.status as CommissionStatus)).map((c) => c.salesperson_id))];
  const ibans = new Map<string, string | null>(
    await Promise.all(toPay.map(async (id) => [id, (await supabase.rpc("get_salesperson_iban", { p_salesperson: id })).data as string | null] as const)),
  );

  const sum = (f: (c: (typeof all)[number]) => boolean, key: "amount_cents" | "fee_cents") => all.filter(f).reduce((n, c) => n + c[key], 0);
  const due = (c: (typeof all)[number]) => c.status === "exigible" || c.status === "no_recibida";
  const open = all.filter((c) => c.status !== "recibida" && c.status !== "pendiente");
  const waiting = all.filter((c) => c.status === "pendiente");
  const done = all.filter((c) => c.status === "recibida");

  const card = (c: (typeof all)[number]) => {
    const lead = c.leads as unknown as { customer_name: string; offers: { title: string } };
    const sp = c.salespeople as unknown as { fiscal: string; profiles: { full_name: string } };
    const hasInvoice = Array.isArray(c.salesperson_invoices) ? c.salesperson_invoices.length > 0 : !!c.salesperson_invoices;
    const status = c.status as CommissionStatus;
    const overdue = due(c) && c.due_at && isPast(c.due_at);
    const iban = ibans.get(c.salesperson_id);
    return (
      <li key={c.id} className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{c.type === "lead" ? "Por lead" : "Por venta"} · {lead.customer_name}</p>
            <p className="text-sm text-muted">{lead.offers.title} · {sp.profiles.full_name} ({sp.fiscal === "autonomo" ? "autónomo" : "particular"})</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xl font-extrabold">{euros(c.amount_cents)}</p>
            <CommissionBadge status={status} />
          </div>
        </div>
        <p className="text-sm text-muted">
          {c.fee_cents > 0 ? `+ ${euros(c.fee_cents)} para ComisionaTe (se factura a fin de mes)` : "Sin tarifa de ComisionaTe"}
          {c.due_at && due(c) && <> · <span className={overdue ? "font-semibold text-danger" : ""}>{overdue ? "Vencida el" : "Pagar antes del"} {dateEs(c.due_at)}</span></>}
        </p>
        {iban && <p className="text-sm">Transferir a: <code className="rounded bg-surface px-2 py-1 font-mono">{iban}</code></p>}
        {status === "no_recibida" && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">El comercial indica que no ha recibido el pago. Revisa la transferencia y vuelve a marcarla.</p>}
        {due(c) && <MarkPaid commissionId={c.id} retry={status === "no_recibida"} />}
        {status === "pagada_empresa" && <p className="text-sm">Pagada. Esperando la confirmación del comercial.</p>}
        <div className="flex flex-wrap gap-4 text-sm font-medium">
          {sp.fiscal === "autonomo" && hasInvoice && <a className="text-primary underline" href={`/api/comisiones/${c.id}/factura`}>Descargar factura del autónomo</a>}
          {sp.fiscal === "autonomo" && !hasInvoice && status !== "pendiente" && <span className="text-muted">Factura del autónomo: aún no subida</span>}
          {sp.fiscal === "particular" && (status === "pagada_empresa" || status === "recibida") && <a className="text-primary underline" href={`/api/comisiones/${c.id}/justificante`}>Descargar justificante (PDF)</a>}
          <Link className="text-primary underline" href={`/empresa/leads/${c.lead_id}`}>Ver lead</Link>
        </div>
      </li>
    );
  };

  const section = (title: string, rows: typeof all, empty: string) => (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {rows.length ? <ul className="space-y-3">{rows.map(card)}</ul> : <p className="text-muted">{empty}</p>}
    </section>
  );

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Comisiones</h1>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Por pagar a comerciales" value={euros(sum(due, "amount_cents"))} tone="danger" />
        <Stat label="Tarifa de ComisionaTe a facturar" value={euros(sum((c) => c.status !== "pendiente", "fee_cents"))} hint="Se factura a final de mes" />
        <Stat label="Pagadas" value={euros(sum((c) => c.status === "recibida", "amount_cents"))} tone="primary" />
      </div>
      {section("Por pagar o por confirmar", open, "No tienes pagos pendientes.")}
      {section("En periodo de cancelación", waiting, "Ninguna venta en periodo de cancelación.")}
      {section("Pagadas", done, "Todavía no hay comisiones cobradas.")}
    </>
  );
}
