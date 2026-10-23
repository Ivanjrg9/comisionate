import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Stat } from "@/components/Stat";
import { euros } from "@/lib/format";

export const metadata: Metadata = { title: "Administración" };

const SOLD = ["periodo_cancelacion", "confirmada", "pagada"];

export default async function AdminHome() {
  const supabase = await createClient();
  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });
  const [companies, salespeople, leads, commissions, invoices, toVerify, disputes, reports, review, overdue] = await Promise.all([
    head("companies").eq("status", "verificada"),
    head("profiles").eq("role", "comercial").eq("status", "activo"),
    supabase.from("leads").select("status"),
    supabase.from("commissions").select("amount_cents, fee_cents, status"),
    supabase.from("platform_invoices").select("total_cents, status"),
    head("companies").eq("status", "pendiente"),
    head("disputes").eq("status", "abierta"),
    head("reports").in("status", ["abierto", "en_revision"]),
    head("leads").eq("needs_review", true),
    head("platform_invoices").eq("status", "vencida"),
  ]);

  const comm = (commissions.data ?? []).filter((c) => c.status !== "anulada");
  const sum = (rows: { total_cents: number; status: string }[], statuses: string[]) => rows.filter((r) => statuses.includes(r.status)).reduce((n, r) => n + r.total_cents, 0);
  const todo = [
    { n: toVerify.count, label: "empresa(s) por verificar", href: "/admin/empresas?estado=pendiente" },
    { n: disputes.count, label: "disputa(s) abierta(s)", href: "/admin/disputas" },
    { n: reports.count, label: "reporte(s) sin resolver", href: "/admin/reportes" },
    { n: review.count, label: "lead(s) sin respuesta en revisión", href: "/admin/leads?revision=1" },
    { n: overdue.count, label: "factura(s) vencida(s)", href: "/admin/facturas?estado=vencida" },
  ].filter((t) => t.n);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Administración</h1>
      <section aria-labelledby="pendiente" className="mb-8">
        <h2 id="pendiente" className="mb-3 text-lg font-semibold">Pendiente de revisar</h2>
        {todo.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {todo.map((t) => (
              <li key={t.label}><Link href={t.href} className="block rounded-xl border border-border-strong bg-surface p-3 font-medium hover:bg-accent/50"><strong className="text-lg">{t.n}</strong> {t.label}</Link></li>
            ))}
          </ul>
        ) : <p className="text-muted">Todo al día ✓</p>}
      </section>
      <section aria-labelledby="metricas">
        <h2 id="metricas" className="mb-3 text-lg font-semibold">Métricas globales</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Empresas activas" value={String(companies.count ?? 0)} />
          <Stat label="Comerciales activos" value={String(salespeople.count ?? 0)} />
          <Stat label="Ventas" value={String((leads.data ?? []).filter((l) => SOLD.includes(l.status)).length)} hint={`${leads.data?.length ?? 0} leads en total`} />
          <Stat label="Comisiones generadas" value={euros(comm.reduce((n, c) => n + c.amount_cents, 0))} hint="Para comerciales, sin anuladas" />
          <Stat label="Ingresos de ComisionaTe" value={euros(sum(invoices.data ?? [], ["pagada"]))} tone="primary" hint="Facturas cobradas" />
          <Stat label="Pendiente de cobro" value={euros(sum(invoices.data ?? [], ["emitida", "vencida"]))} tone="danger" hint="Facturas emitidas o vencidas" />
        </div>
      </section>
    </>
  );
}
