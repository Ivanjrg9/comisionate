import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dateEs, euros } from "@/lib/format";
import { AccountBadge, AccountButtons } from "../../AccountButtons";
import { TermsForm } from "./TermsForm";
import { VerifyButtons } from "./VerifyButtons";

export const metadata: Metadata = { title: "Empresa" };

export default async function AdminCompanyPage({ params }: PageProps<"/admin/empresas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: c } = await supabase.from("companies").select("*, profiles:owner_id(id, full_name, email, status)").eq("id", id).single();
  if (!c) notFound();
  const owner = c.profiles as unknown as { id: string; full_name: string; email: string; status: "activo" | "suspendido" | "expulsado" | "baja" };
  const [{ data: offers }, { data: invoices }, { data: fee }, { data: unpaid }] = await Promise.all([
    supabase.from("offers").select("id, title, status").eq("company_id", id),
    supabase.from("platform_invoices").select("id, number, total_cents, status").eq("company_id", id).order("period", { ascending: false }),
    supabase.from("app_settings").select("value").eq("key", "fee_percent").single(),
    supabase.from("commissions").select("id").eq("company_id", id).eq("status", "no_recibida"),
  ]);

  return (
    <div className="max-w-2xl space-y-8">
      <Link href="/admin/empresas" className="text-sm text-primary underline">← Empresas</Link>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{c.legal_name}</h1>
        <p className="text-muted">CIF {c.cif} · {c.zone || "sin zona"} · estado: <strong className="capitalize">{c.status}</strong>{c.suspension_reason && ` (${c.suspension_reason})`}</p>
        <p className="text-sm">Responsable: {owner.full_name} · {owner.email} · <AccountBadge status={owner.status} /></p>
        {c.baja_requested_at && <p className="rounded-lg bg-accent/30 p-2 text-sm">Baja solicitada el {dateEs(c.baja_requested_at)} (se cierra a los 90 días si todo está pagado).</p>}
        {!!unpaid?.length && <p className="rounded-lg bg-danger/10 p-2 text-sm text-danger">{unpaid.length} comisión(es) reclamadas como «no recibidas».</p>}
      </header>

      <section aria-labelledby="acciones" className="space-y-4 rounded-xl border border-border bg-surface p-4">
        <h2 id="acciones" className="text-lg font-bold">Acciones</h2>
        <VerifyButtons companyId={c.id} verified={c.status === "verificada"} />
        <AccountButtons profileId={owner.id} status={owner.status} />
        <p className="text-sm text-muted">Suspender oculta sus ofertas; expulsar las cierra. Los pagos pendientes legítimos se respetan en ambas direcciones.</p>
      </section>

      <section aria-labelledby="condiciones" className="space-y-3">
        <h2 id="condiciones" className="text-lg font-bold">Tarifa de ComisionaTe</h2>
        <p className="text-sm text-muted">Impagos acumulados: {c.late_payments}{c.late_payments >= 3 && " · con 3 o más puedes expulsar"}</p>
        <TermsForm companyId={c.id} founderUntil={c.founder_until} fee={c.fee_percent_override === null ? null : Number(c.fee_percent_override)} globalFee={Number(fee?.value ?? 10)} />
      </section>

      <section aria-labelledby="ofertas">
        <h2 id="ofertas" className="mb-2 text-lg font-bold">Ofertas</h2>
        <ul className="space-y-1 text-sm">{(offers ?? []).map((o) => <li key={o.id}>{o.title} · <span className="text-muted">{o.status}</span></li>)}</ul>
        {!offers?.length && <p className="text-muted">Sin ofertas.</p>}
      </section>
      <section aria-labelledby="facturas">
        <h2 id="facturas" className="mb-2 text-lg font-bold">Facturas</h2>
        <ul className="space-y-1 text-sm">{(invoices ?? []).map((i) => <li key={i.id}>{i.number} · {euros(i.total_cents)} · <span className="text-muted">{i.status}</span></li>)}</ul>
        {!invoices?.length && <p className="text-muted">Sin facturas.</p>}
      </section>
    </div>
  );
}
