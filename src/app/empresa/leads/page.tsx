import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionForm } from "@/components/ActionForm";
import { qualifyLead } from "./actions";

export const metadata: Metadata = { title: "Leads y ventas" };

const FILTERS = Object.keys(LEAD_STATUS_LABEL).filter((s) => s !== "venta") as LeadStatus[];
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);

export default async function CompanyLeadsPage({ searchParams }: PageProps<"/empresa/leads">) {
  const { estado } = await searchParams;
  const filter = FILTERS.find((s) => s === estado);
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("id, customer_name, status, created_at, needs_review, offers(title), salespeople(profiles(full_name))")
    .order("created_at", { ascending: false });
  if (filter) query = query.eq("status", filter);
  const { data: leads, error } = await query;
  if (error) throw new Error(error.message);

  const chip = (href: string, label: string, active: boolean) => (
    <Link key={label} href={href} aria-current={active ? "page" : undefined}
      className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface"}`}>
      {label}
    </Link>
  );

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Leads y ventas</h1>
      <nav aria-label="Filtrar por estado" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {chip("/empresa/leads", "Todos", !filter)}
        {FILTERS.map((s) => chip(`/empresa/leads?estado=${s}`, LEAD_STATUS_LABEL[s], filter === s))}
      </nav>
      {!leads?.length ? (
        <p className="text-muted">No hay leads {filter ? "en este estado" : "todavía"}.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((l) => {
            const offer = l.offers as unknown as { title: string };
            const sp = l.salespeople as unknown as { profiles: { full_name: string } };
            const waiting = l.status === "registrado" ? daysSince(l.created_at) : 0;
            return (
              <li key={l.id} className="rounded-xl border border-border p-4">
                <Link href={`/empresa/leads/${l.id}`} className="block">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{l.customer_name}</span>
                    <StatusBadge status={l.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">{offer.title} · traído por {sp.profiles.full_name}</p>
                  {waiting >= 10 && (
                    <p className="mt-1 text-sm font-medium text-danger">
                      Sin respuesta desde hace {waiting} días{l.needs_review ? " · en revisión por ComisionaTe" : ": responde antes de 15 días"}
                    </p>
                  )}
                </Link>
                {l.status === "registrado" && (
                  <div className="mt-3">
                    <ActionForm action={qualifyLead} label="Cualificar" tone="secondary">
                      <input type="hidden" name="lead_id" value={l.id} />
                    </ActionForm>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
