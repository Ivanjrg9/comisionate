import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateEs } from "@/lib/format";
import { Pagination } from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import { ilikeAny, pageParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Empresas" };

const STATES = ["pendiente", "verificada", "suspendida", "expulsada", "baja"];

export default async function AdminCompaniesPage({ searchParams }: PageProps<"/admin/empresas">) {
  const sp = await searchParams;
  const estado = sp.estado;
  const { page, q, from, to } = pageParams(sp);
  const filter = STATES.find((s) => s === estado);
  const supabase = await createClient();
  let query = supabase.from("companies").select("id, legal_name, cif, status, founder_until, late_payments, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(from, to);
  if (filter) query = query.eq("status", filter);
  if (q) query = query.or(ilikeAny(["legal_name", "cif"], q));
  const { data, count } = await query;

  const chip = (href: string, label: string, active: boolean) => (
    <Link key={label} href={href} aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium capitalize ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface"}`}>{label}</Link>
  );
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Empresas</h1>
      <SearchBox q={q} placeholder="Buscar por razón social o CIF" keep={{ estado: filter }} />
      <nav aria-label="Filtrar por estado" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {chip("/admin/empresas", "Todas", !filter)}
        {STATES.map((s) => chip(`/admin/empresas?estado=${s}`, s, filter === s))}
      </nav>
      <ul className="space-y-3">
        {(data ?? []).map((c) => (
          <li key={c.id}>
            <Link href={`/admin/empresas/${c.id}`} className="block rounded-xl border border-border p-4 hover:bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{c.legal_name} <span className="font-normal text-muted">· {c.cif}</span></span>
                <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold capitalize">{c.status}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                Alta {dateEs(c.created_at)}{c.founder_until && ` · fundadora hasta ${dateEs(c.founder_until)}`}{c.late_payments > 0 && ` · ${c.late_payments} impago(s)`}
              </p>
            </Link>
          </li>
        ))}
        {!data?.length && <p className="text-muted">No hay empresas {filter ? "en este estado" : ""}.</p>}
      </ul>
      <Pagination page={page} total={count ?? 0} basePath="/admin/empresas" params={{ estado: filter, q }} />
    </>
  );
}
