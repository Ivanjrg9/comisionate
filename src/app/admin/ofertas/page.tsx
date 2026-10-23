import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { amountLabel } from "@/lib/format";

export const metadata: Metadata = { title: "Ofertas" };

export default async function AdminOffersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offers")
    .select("id, title, status, lead_kind, lead_value, sale_kind, sale_value, companies(legal_name), memberships(count)")
    .order("created_at", { ascending: false });
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Ofertas</h1>
      <ul className="space-y-3">
        {(data ?? []).map((o) => (
          <li key={o.id} className="rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{o.title}</span>
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold capitalize">{o.status}</span>
            </div>
            <p className="text-sm text-muted">
              {(o.companies as unknown as { legal_name: string }).legal_name} · {[o.lead_kind && `Lead ${amountLabel(o.lead_kind, o.lead_value!)}`, o.sale_kind && `Venta ${amountLabel(o.sale_kind, o.sale_value!)}`].filter(Boolean).join(" · ")} · {o.memberships[0]?.count ?? 0} comerciales
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
