import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Avatar } from "@/components/Avatar";
import { Badges, Rating, type CompanyStats } from "@/components/Badges";
import { buttonClass, secondaryButtonClass } from "@/components/form";
import { estimatedCommissionCents } from "@/lib/domain/offers";
import { amountLabel, euros } from "@/lib/format";

export const metadata: Metadata = {
  title: "Ofertas para comerciales",
  description: "Ofertas de instalación de placas solares con comisión para comerciales independientes. Regístrate gratis y únete a las que quieras.",
  alternates: { canonical: "/ofertas" },
};

// Página pública sin sesión: se regenera cada 5 minutos.
export const revalidate = 300;

export default async function PublicOffersPage() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data } = await supabase
    .from("offers")
    .select("id, title, description, only_autonomos, product_price_cents, lead_kind, lead_value, sale_kind, sale_value, zones, companies!inner(id, legal_name, logo_path)")
    .eq("status", "activa")
    .limit(60);
  const offers = (data ?? []).map((o) => ({ ...o, est: estimatedCommissionCents(o) })).sort((a, b) => b.est - a.est);

  const ids = [...new Set(offers.map((o) => (o.companies as unknown as { id: string }).id))];
  const { data: statRows } = ids.length ? await supabase.rpc("company_public_stats", { p_companies: ids }) : { data: [] };
  const stats = new Map<string, CompanyStats>((statRows ?? []).map((r: CompanyStats & { company_id: string }) => [r.company_id, r]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-semibold sm:text-4xl">Ofertas disponibles ahora</h1>
      <p className="mb-8 mt-2 max-w-2xl text-muted">
        Estas son las ofertas activas. Regístrate gratis para ver las condiciones completas, unirte y conseguir tu código de referido.
      </p>

      {!offers.length ? (
        <p className="text-muted">Ahora mismo no hay ofertas publicadas. Vuelve pronto o <Link href="/registro?rol=comercial" className="text-link underline underline-offset-4">crea tu cuenta</Link> para enterarte de las nuevas.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {offers.map((o) => {
            const company = o.companies as unknown as { id: string; legal_name: string; logo_path: string | null };
            const st = stats.get(company.id);
            const logo = company.logo_path ? supabase.storage.from("logos").getPublicUrl(company.logo_path).data.publicUrl : null;
            return (
              <li key={o.id} className="flex flex-col rounded-xl border border-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar src={logo} name={company.legal_name} />
                  <div>
                    <h2 className="font-semibold">{o.title}</h2>
                    <p className="text-sm text-muted">{company.legal_name}</p>
                  </div>
                </div>
                {st && <div className="mt-3 space-y-1"><Badges stats={st} /><Rating rating={st.rating === null ? null : Number(st.rating)} reviews={st.reviews} /></div>}
                <p className="mt-3 text-lg font-semibold text-primary">{o.est > 0 ? `Hasta ${euros(o.est)} por cliente` : "Comisión a consultar"}</p>
                <p className="text-sm text-muted">{[o.lead_kind && `Lead: ${amountLabel(o.lead_kind, o.lead_value!)}`, o.sale_kind && `Venta: ${amountLabel(o.sale_kind, o.sale_value!)}`].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-sm">
                  {o.zones.length ? o.zones.join(", ") : "Toda España"}
                  {o.only_autonomos && <span className="ml-2 rounded-full border border-border-strong bg-surface px-2 py-0.5 text-xs font-medium">Solo autónomos</span>}
                </p>
                {o.description && <p className="mt-2 line-clamp-3 text-sm text-muted">{o.description}</p>}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/registro?rol=comercial" className={buttonClass}>Crear cuenta de comercial</Link>
        <Link href="/login" className={secondaryButtonClass}>Ya tengo cuenta</Link>
      </div>
    </main>
  );
}
