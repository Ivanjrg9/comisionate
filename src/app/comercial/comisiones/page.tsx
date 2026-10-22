import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CommissionBadge } from "@/components/CommissionBadge";
import { Stat } from "@/components/Stat";
import { bucket, type CommissionStatus } from "@/lib/commission-status";
import { invoiceBreakdown, particularNotice } from "@/lib/domain/fiscal";
import { dateEs, euros } from "@/lib/format";
import { ConfirmPayment, InvoiceUpload } from "./PaymentActions";
import { ReviewForm } from "@/components/TrustWidgets";

export const metadata: Metadata = { title: "Mis comisiones" };

export default async function SalespersonCommissionsPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const [{ data: sp }, { data: commissions, error }, { data: myReviews }] = await Promise.all([
    supabase.from("salespeople").select("fiscal, new_autonomo").eq("id", auth.user!.id).single(),
    supabase
      .from("commissions")
      .select("id, type, amount_cents, status, due_at, created_at, leads(id, customer_name, offers(title)), salesperson_invoices(id)")
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("commission_id").eq("author_id", auth.user!.id),
  ]);
  const reviewed = new Set((myReviews ?? []).map((r) => r.commission_id));
  if (error) throw new Error(error.message);

  const totals = { pendiente: 0, confirmada: 0, cobrada: 0 };
  for (const c of commissions ?? []) {
    const b = bucket(c.status as CommissionStatus);
    if (b) totals[b] += c.amount_cents;
  }
  const year = new Date().getFullYear();
  const thisYear = (commissions ?? []).filter((c) => c.status !== "anulada" && new Date(c.created_at).getFullYear() === year).length;
  const notice = sp?.fiscal === "particular" ? particularNotice(thisYear) : null;
  const isAutonomo = sp?.fiscal === "autonomo";

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Mis comisiones</h1>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Pendientes de firmeza" value={euros(totals.pendiente)} hint="Ventas en periodo de cancelación (14 días)" />
        <Stat label="Confirmadas, por cobrar" value={euros(totals.confirmada)} hint="Comisiones firmes que debe pagar la empresa" tone="primary" />
        <Stat label="Cobradas" value={euros(totals.cobrada)} />
      </div>

      {notice && (
        <p role={notice === "destacado" ? "alert" : "note"} className={`mb-6 rounded-lg p-3 text-sm ${notice === "destacado" ? "bg-danger/10 font-medium" : "bg-surface"}`}>
          {notice === "destacado" && `Ya llevas ${thisYear} comisiones este año. `}
          Si vas a vender de forma habitual, consulta con un gestor si debes darte de alta como autónomo.
        </p>
      )}

      {!commissions?.length ? (
        <p className="text-muted">Todavía no tienes comisiones. Aparecen cuando la empresa cualifica o cierra uno de tus clientes.</p>
      ) : (
        <ul className="space-y-4">
          {commissions.map((c) => {
            const lead = c.leads as unknown as { id: string; customer_name: string; offers: { title: string } };
            const hasInvoice = Array.isArray(c.salesperson_invoices) ? c.salesperson_invoices.length > 0 : !!c.salesperson_invoices;
            const status = c.status as CommissionStatus;
            const firm = status === "exigible" || status === "pagada_empresa" || status === "recibida" || status === "no_recibida";
            const b = invoiceBreakdown(c.amount_cents, !!sp?.new_autonomo);
            return (
              <li key={c.id} className="space-y-3 rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.type === "lead" ? "Comisión por lead" : "Comisión por venta"} · {lead.customer_name}</p>
                    <p className="text-sm text-muted">{lead.offers.title}</p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-xl font-extrabold">{euros(c.amount_cents)}</p>
                    <CommissionBadge status={status} />
                  </div>
                </div>
                {c.due_at && status === "exigible" && <p className="text-sm">La empresa debe pagarla antes del <strong>{dateEs(c.due_at)}</strong>.</p>}
                {status === "no_recibida" && <p className="text-sm text-danger">Has indicado que no lo recibiste. La empresa lo ve y el equipo de ComisionaTe puede intervenir si sigue sin resolverse.</p>}
                {status === "pagada_empresa" && (
                  <div className="space-y-2 rounded-lg bg-primary/10 p-3">
                    <p className="font-medium">La empresa dice que ya te ha pagado. ¿Lo has recibido?</p>
                    <ConfirmPayment commissionId={c.id} />
                  </div>
                )}
                {isAutonomo && firm && (
                  <div className="space-y-2 rounded-lg bg-surface p-3 text-sm">
                    <p className="font-medium">Tu factura (orientativo)</p>
                    <p>Comisión {euros(b.base)} + IVA 21 % {euros(b.iva)} − IRPF {b.irpfPercent} % {euros(b.irpf)} = <strong>{euros(b.total)}</strong></p>
                    {hasInvoice ? (
                      <p className="font-medium text-primary">Factura subida ✓ <a className="underline" href={`/api/comisiones/${c.id}/factura`}>Descargar</a></p>
                    ) : <InvoiceUpload commissionId={c.id} />}
                  </div>
                )}
                {status === "recibida" && !reviewed.has(c.id) && <ReviewForm commissionId={c.id} whom="la empresa" />}
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                  {sp?.fiscal === "particular" && (status === "pagada_empresa" || status === "recibida") && (
                    <a className="text-primary underline" href={`/api/comisiones/${c.id}/justificante`}>Descargar justificante de pago (PDF)</a>
                  )}
                  <Link className="text-primary underline" href={`/comercial/leads/${lead.id}`}>Ver cliente</Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
