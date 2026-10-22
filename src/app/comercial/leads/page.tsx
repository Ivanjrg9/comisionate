import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";
import { StatusBadge } from "@/components/StatusBadge";
import { dateEs } from "@/lib/format";
import { buttonClass } from "@/components/form";
import { Pagination } from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import { ilikeAny, pageParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Mis clientes" };

const FILTERS = Object.keys(LEAD_STATUS_LABEL).filter((s) => s !== "venta") as LeadStatus[];

export default async function SalespersonLeadsPage({ searchParams }: PageProps<"/comercial/leads">) {
  const sp = await searchParams;
  const estado = sp.estado;
  const { page, q, from, to } = pageParams(sp);
  const filter = FILTERS.find((s) => s === estado);
  const supabase = await createClient();
  let query = supabase.from("leads").select("id, customer_name, status, created_at, offers(title)", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (filter) query = query.eq("status", filter);
  if (q) query = query.or(ilikeAny(["customer_name", "phone_e164"], q));
  const { data: leads, error, count } = await query;
  // Una página fuera de rango (PGRST103) no es un fallo: se muestra vacía con enlace al inicio.
  if (error && error.code !== "PGRST103") throw new Error(error.message);

  const chip = (href: string, label: string, active: boolean) => (
    <Link key={label} href={href} aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface"}`}>
      {label}
    </Link>
  );
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mis clientes</h1>
        <Link href="/comercial/leads/nuevo" className={buttonClass}>Registrar cliente</Link>
      </div>
      <SearchBox q={q} placeholder="Buscar por nombre o teléfono" keep={{ estado: filter }} />
      <nav aria-label="Filtrar por estado" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {chip("/comercial/leads", "Todos", !filter)}
        {FILTERS.map((s) => chip(`/comercial/leads?estado=${s}`, LEAD_STATUS_LABEL[s], filter === s))}
      </nav>
      {!leads?.length ? (
        <p className="text-muted">{page > 1 && <><Link href="/comercial/leads" className="font-semibold text-primary underline">Volver a la primera página</Link>. </>}No hay clientes {filter ? "en este estado" : "registrados todavía"}.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/comercial/leads/${l.id}`} className="block rounded-xl border border-border p-4 hover:bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{l.customer_name}</span>
                  <StatusBadge status={l.status} />
                </div>
                <p className="mt-1 text-sm text-muted">{(l.offers as unknown as { title: string }).title} · {dateEs(l.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} total={count ?? 0} basePath="/comercial/leads" params={{ estado: filter, q }} />
    </>
  );
}
