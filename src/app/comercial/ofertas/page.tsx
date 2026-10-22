import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSectors } from "@/lib/data";
import { PROVINCES } from "@/lib/provinces";
import { amountLabel, euros } from "@/lib/format";
import { estimatedCommissionCents } from "@/lib/domain/offers";
import { Field, Select, buttonClass } from "@/components/form";
import { Avatar } from "@/components/Avatar";
import { publicUrl } from "@/lib/storage";
import { Badges, Rating, type CompanyStats } from "@/components/Badges";
import { Pagination } from "@/components/Pagination";
import { PAGE_SIZE, pageParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Ofertas" };

export default async function MarketplacePage({ searchParams }: PageProps<"/comercial/ofertas">) {
  const q = Object.fromEntries(Object.entries(await searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? "")]));
  const pg = pageParams(await searchParams);
  const supabase = await createClient();
  const sectors = await getSectors();

  let query = supabase
    .from("offers")
    .select("id, title, only_autonomos, product_price_cents, lead_kind, lead_value, sale_kind, sale_value, zones, companies!inner(id, legal_name, logo_path)")
    .eq("status", "activa")
    .order("created_at", { ascending: false });
  if (q.sector) query = query.eq("sector_id", Number(q.sector));
  if (q.zona) query = query.contains("zones", [q.zona]);
  if (q.tipo === "lead") query = query.not("lead_kind", "is", null);
  if (q.tipo === "venta") query = query.not("sale_kind", "is", null);

  const min = Number(String(q.min ?? "").replace(",", ".")) * 100 || 0;
  const offers = ((await query).data ?? [])
    .map((o) => ({ ...o, est: estimatedCommissionCents(o) }))
    .filter((o) => o.est >= min)
    .sort((a, b) => b.est - a.est);
  const total = offers.length;
  const visible = offers.slice(pg.from, pg.from + PAGE_SIZE);

  const companyIds = [...new Set(visible.map((o) => (o.companies as unknown as { id: string }).id))];
  const { data: statRows } = companyIds.length ? await supabase.rpc("company_public_stats", { p_companies: companyIds }) : { data: [] };
  const stats = new Map<string, CompanyStats>((statRows ?? []).map((r: CompanyStats & { company_id: string }) => [r.company_id, r]));

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Ofertas disponibles</h1>
      <form className="mb-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Select label="Sector" name="sector" defaultValue={q.sector ?? ""}>
          <option value="">Todos</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select label="Provincia" name="zona" defaultValue={q.zona ?? ""}>
          <option value="">Todas</option>
          {PROVINCES.map((p) => <option key={p}>{p}</option>)}
        </Select>
        <Select label="Tipo de comisión" name="tipo" defaultValue={q.tipo ?? ""}>
          <option value="">Cualquiera</option>
          <option value="lead">Por lead</option>
          <option value="venta">Por venta</option>
        </Select>
        <Field label="Comisión mínima (€)" name="min" inputMode="decimal" defaultValue={q.min ?? ""} />
        <button className={buttonClass}>Filtrar</button>
      </form>

      {!visible.length ? (
        <p className="text-muted">No hay ofertas con esos filtros.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((o) => {
            const company = o.companies as unknown as { id: string; legal_name: string; logo_path: string | null };
            const st = stats.get(company.id);
            return (
              <li key={o.id}>
                <Link href={`/comercial/ofertas/${o.id}`} className="block h-full rounded-xl border border-border p-4 hover:bg-surface">
                  <div className="flex items-center gap-3">
                    <Avatar src={publicUrl(supabase, "logos", company.logo_path)} name={company.legal_name} />
                    <div>
                      <p className="font-semibold">{o.title}</p>
                      <p className="text-sm text-muted">{company.legal_name}</p>
                    </div>
                  </div>
                  {st && <div className="mt-3 space-y-1"><Badges stats={st} /><Rating rating={st.rating === null ? null : Number(st.rating)} reviews={st.reviews} /></div>}
                  <p className="mt-3 text-lg font-bold text-primary">
                    {o.est > 0 ? `Hasta ${euros(o.est)} por cliente` : "Comisión a consultar"}
                  </p>
                  <p className="text-sm text-muted">
                    {[o.lead_kind && `Lead: ${amountLabel(o.lead_kind, o.lead_value!)}`, o.sale_kind && `Venta: ${amountLabel(o.sale_kind, o.sale_value!)}`].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-2 text-sm">
                    {o.zones.length ? o.zones.join(", ") : "Toda España"}
                    {o.only_autonomos && <span className="ml-2 rounded-full bg-accent/40 px-2 py-0.5 text-xs font-medium">Solo autónomos</span>}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={pg.page} total={total} basePath="/comercial/ofertas" params={{ sector: q.sector, zona: q.zona, tipo: q.tipo, min: q.min }} />
    </>
  );
}
