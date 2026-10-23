import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/StatusBadge";
import { dateEs } from "@/lib/format";
import { Pagination } from "@/components/Pagination";
import { SearchBox } from "@/components/SearchBox";
import { ilikeAny, pageParams } from "@/lib/pagination";

export const metadata: Metadata = { title: "Leads y ventas" };

export default async function AdminLeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const sp = await searchParams;
  const revision = typeof sp.revision === "string" ? sp.revision : undefined;
  const { page, q, from, to } = pageParams(sp);
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("id, customer_name, status, created_at, needs_review, offers(title, companies(legal_name)), salespeople(profiles(full_name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (revision) query = query.eq("needs_review", true);
  if (q) query = query.or(ilikeAny(["customer_name", "phone_e164"], q));
  const { data, count } = await query;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Leads y ventas</h1>
        <Link href={revision ? "/admin/leads" : "/admin/leads?revision=1"} className="text-sm text-link underline underline-offset-4">
          {revision ? "Ver todos" : "Solo los que requieren revisión"}
        </Link>
      </div>
      <SearchBox q={q} placeholder="Buscar por cliente o teléfono" keep={{ revision }} />
      <ul className="space-y-3">
        {(data ?? []).map((l) => {
          const o = l.offers as unknown as { title: string; companies: { legal_name: string } };
          const sp = l.salespeople as unknown as { profiles: { full_name: string } };
          return (
            <li key={l.id}>
              <Link href={`/admin/leads/${l.id}`} className="block rounded-xl border border-border p-4 hover:bg-surface">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{l.customer_name}</span>
                  <span className="flex items-center gap-2">{l.needs_review && <span className="rounded-full bg-danger/15 px-3 py-1 text-xs font-semibold text-danger">Revisión</span>}<StatusBadge status={l.status} /></span>
                </div>
                <p className="text-sm text-muted">{o.title} · {o.companies.legal_name} · {sp.profiles.full_name} · {dateEs(l.created_at)}</p>
              </Link>
            </li>
          );
        })}
        {!data?.length && <p className="text-muted">No hay leads.</p>}
      </ul>
      <Pagination page={page} total={count ?? 0} basePath="/admin/leads" params={{ revision, q }} />
    </>
  );
}
