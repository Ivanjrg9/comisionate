import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getMyCompany } from "@/lib/data";
import { amountLabel } from "@/lib/format";
import { buttonClass } from "@/components/form";

export const metadata: Metadata = { title: "Mis ofertas" };

const STATUS: Record<string, string> = { borrador: "Borrador", activa: "Activa", pausada: "Pausada", oculta: "Oculta", cerrada: "Cerrada" };

export default async function OffersPage() {
  const supabase = await createClient();
  const company = await getMyCompany();
  const { data: offers } = await supabase
    .from("offers")
    .select("id, title, status, lead_kind, lead_value, sale_kind, sale_value, memberships(count)")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis ofertas</h1>
        <Link href="/empresa/ofertas/nueva" className={buttonClass}>Nueva oferta</Link>
      </div>
      {company.status !== "verificada" && (
        <p role="status" className="mb-4 rounded-xl border border-border-strong bg-surface p-3 text-sm">
          Tu empresa aún no está verificada. Puedes preparar ofertas como borrador; podrás publicarlas cuando el equipo de ComisionaTe te verifique.
        </p>
      )}
      {!offers?.length ? (
        <p className="text-muted">Todavía no has creado ninguna oferta.</p>
      ) : (
        <ul className="space-y-3">
          {offers.map((o) => (
            <li key={o.id}>
              <Link href={`/empresa/ofertas/${o.id}`} className="block rounded-xl border border-border p-4 hover:bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{o.title}</span>
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium">{STATUS[o.status]}</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {[o.lead_kind && `Lead: ${amountLabel(o.lead_kind, o.lead_value!)}`, o.sale_kind && `Venta: ${amountLabel(o.sale_kind, o.sale_value!)}`].filter(Boolean).join(" · ")}
                  {" · "}{o.memberships[0]?.count ?? 0} comerciales
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
