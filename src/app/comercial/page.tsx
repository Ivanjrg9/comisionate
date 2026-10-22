import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { BarList, Stat } from "@/components/Stat";
import { bucket, type CommissionStatus } from "@/lib/commission-status";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";
import { euros } from "@/lib/format";
import { buttonClass } from "@/components/form";

export const metadata: Metadata = { title: "Panel de comercial" };

export default async function SalespersonHome() {
  const supabase = await createClient();
  const profile = await getProfile();
  const [{ data: commissions }, { data: leads }, { count: codes }, { data: sp }] = await Promise.all([
    supabase.from("commissions").select("amount_cents, status"),
    supabase.from("leads").select("status"),
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "activa"),
    supabase.from("salespeople").select("nif").eq("id", profile!.id).single(),
  ]);

  const totals = { pendiente: 0, confirmada: 0, cobrada: 0 };
  let toConfirm = 0;
  for (const c of commissions ?? []) {
    const b = bucket(c.status as CommissionStatus);
    if (b) totals[b] += c.amount_cents;
    if (c.status === "pagada_empresa") toConfirm++;
  }
  const byStatus = Object.keys(LEAD_STATUS_LABEL)
    .filter((s) => s !== "venta")
    .map((s) => ({ label: LEAD_STATUS_LABEL[s as LeadStatus], value: (leads ?? []).filter((l) => l.status === s).length }));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hola, {profile?.full_name}</h1>
        <Link href="/comercial/leads/nuevo" className={buttonClass}>Registrar cliente</Link>
      </div>

      {!sp?.nif && (
        <Link href="/comercial/perfil" className="mb-6 block rounded-lg bg-accent/30 p-3 font-medium underline">
          Completa tu perfil (DNI/NIE y si eres autónomo o particular) para poder cobrar tus comisiones.
        </Link>
      )}

      {toConfirm > 0 && (
        <Link href="/comercial/comisiones" className="mb-6 block rounded-lg bg-primary/15 p-3 font-medium underline">
          Tienes {toConfirm} pago(s) por confirmar: ¿te han llegado?
        </Link>
      )}
      {codes === 0 && (
        <p className="mb-6 rounded-lg bg-accent/30 p-3">Aún no tienes ningún código. <Link href="/comercial/ofertas" className="font-semibold underline">Mira las ofertas y únete a una</Link>.</p>
      )}

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Pendientes de firmeza" value={euros(totals.pendiente)} hint="En periodo de cancelación" />
        <Stat label="Confirmadas, por cobrar" value={euros(totals.confirmada)} tone="primary" />
        <Stat label="Cobradas" value={euros(totals.cobrada)} />
      </div>

      <section aria-labelledby="clientes">
        <h2 id="clientes" className="mb-3 text-lg font-bold">Tus clientes por estado</h2>
        <BarList items={byStatus} />
      </section>
    </>
  );
}
