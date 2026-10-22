import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyCompany } from "@/lib/data";
import { BarList, Stat } from "@/components/Stat";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";
import { daysSince, euros, isPast } from "@/lib/format";

export const metadata: Metadata = { title: "Panel de empresa" };

const SOLD: LeadStatus[] = ["periodo_cancelacion", "confirmada", "pagada"];

export default async function CompanyHome() {
  const supabase = await createClient();
  const company = await getMyCompany();
  const [{ data: leads }, { data: commissions }, { count: pendingRequests }, { data: inDefault }] = await Promise.all([
    supabase.from("leads").select("status, created_at, salesperson_id, salespeople(profiles(full_name))"),
    supabase.from("commissions").select("amount_cents, fee_cents, status, due_at, salesperson_id"),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
    supabase.rpc("company_in_default", { p_company: company.id }),
  ]);

  const all = leads ?? [];
  const sold = all.filter((l) => SOLD.includes(l.status as LeadStatus));
  const conversion = all.length ? Math.round((sold.length / all.length) * 100) : 0;
  const waiting = all.filter((l) => l.status === "registrado" && daysSince(l.created_at) > 10).length;
  const overdue = (commissions ?? []).filter((c) => (c.status === "exigible" || c.status === "no_recibida") && c.due_at && isPast(c.due_at)).length;
  const pay = (statuses: string[]) => (commissions ?? []).filter((c) => statuses.includes(c.status)).reduce((n, c) => n + c.amount_cents, 0);

  const ranking = new Map<string, { name: string; sales: number; leads: number }>();
  for (const l of all) {
    const name = (l.salespeople as unknown as { profiles: { full_name: string } }).profiles.full_name;
    const r = ranking.get(l.salesperson_id) ?? { name, sales: 0, leads: 0 };
    r.leads++;
    if (SOLD.includes(l.status as LeadStatus)) r.sales++;
    ranking.set(l.salesperson_id, r);
  }
  const top = [...ranking.values()].sort((a, b) => b.sales - a.sales || b.leads - a.leads).slice(0, 5);
  const byStatus = Object.keys(LEAD_STATUS_LABEL)
    .filter((s) => s !== "venta")
    .map((s) => ({ label: LEAD_STATUS_LABEL[s as LeadStatus], value: all.filter((l) => l.status === s).length }));

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">{company.legal_name}</h1>
      <p className="mb-6 text-muted">
        {company.status === "verificada" ? "Empresa verificada ✓" : "Pendiente de verificación por ComisionaTe: mientras tanto puedes preparar ofertas, pero no publicarlas."}
        {company.founder_until && !isPast(company.founder_until + "T23:59:59") && ` · Empresa fundadora: sin tarifa del 10 % hasta el ${new Date(company.founder_until).toLocaleDateString("es-ES")}.`}
      </p>

      <div className="mb-6 space-y-2">
        {(!company.sector_id || !company.billing_address) && (
          <Link href="/empresa/perfil" className="block rounded-lg bg-accent/30 p-3 font-medium underline">
            Completa el perfil de tu empresa (sector y datos de facturación) para poder publicar ofertas y recibir facturas.
          </Link>
        )}
        {company.status === "suspendida" && (
          <Link href="/empresa/facturas" role="alert" className="block rounded-lg bg-danger/10 p-3 font-semibold text-danger underline">
            Tu cuenta está suspendida por un pago pendiente. Se reactivará en cuanto se registre el pago.
          </Link>
        )}
        {inDefault && company.status !== "suspendida" && (
          <Link href="/empresa/comisiones" className="block rounded-lg bg-danger/10 p-3 font-medium text-danger underline">
            Empresa con pagos pendientes: tus ofertas están ocultas y no puedes validar ventas nuevas hasta ponerte al día.
          </Link>
        )}
        {waiting > 0 && <Link href="/empresa/leads?estado=registrado" className="block rounded-lg bg-danger/10 p-3 font-medium underline">{waiting} lead(s) llevan más de 10 días sin respuesta. Tienes 15 días para contestar.</Link>}
        {overdue > 0 && <Link href="/empresa/comisiones" className="block rounded-lg bg-danger/10 p-3 font-medium underline">{overdue} comisión(es) con el plazo de pago vencido.</Link>}
        {!!pendingRequests && <p className="rounded-lg bg-accent/30 p-3 font-medium">Tienes {pendingRequests} solicitud(es) de comerciales por aprobar, en cada oferta.</p>}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Leads registrados" value={String(all.length)} />
        <Stat label="Ventas" value={String(sold.length)} hint={`Conversión ${conversion} %`} tone="primary" />
        <Stat label="Comisiones por pagar" value={euros(pay(["exigible", "no_recibida"]))} tone="danger" />
        <Stat label="Comisiones pagadas" value={euros(pay(["pagada_empresa", "recibida"]))} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="estados">
          <h2 id="estados" className="mb-3 text-lg font-bold">Leads por estado</h2>
          <BarList items={byStatus} />
        </section>
        <section aria-labelledby="ranking">
          <h2 id="ranking" className="mb-3 text-lg font-bold">Ranking de comerciales</h2>
          {top.length ? (
            <ol className="space-y-2">
              {top.map((r, i) => (
                <li key={r.name} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span><span className="mr-2 font-bold text-primary">{i + 1}.</span>{r.name}</span>
                  <span className="text-sm text-muted">{r.sales} venta(s) · {r.leads} lead(s)</span>
                </li>
              ))}
            </ol>
          ) : <p className="text-muted">Aún no hay actividad.</p>}
        </section>
      </div>
    </>
  );
}
