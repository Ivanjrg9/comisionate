import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateEs, euros } from "@/lib/format";
import { MarkInvoicePaid } from "./MarkPaid";

export const metadata: Metadata = { title: "Facturas" };

const FILTERS = [["", "Todas"], ["emitida", "Emitidas"], ["vencida", "Vencidas"], ["pagada", "Pagadas"]] as const;

export default async function AdminInvoicesPage({ searchParams }: PageProps<"/admin/facturas">) {
  const { estado } = await searchParams;
  const filter = FILTERS.find(([v]) => v && v === estado)?.[0];
  const supabase = await createClient();
  let query = supabase
    .from("platform_invoices")
    .select("id, number, total_cents, status, issued_at, due_at, paid_at, dunning_stage, companies(legal_name)")
    .order("issued_at", { ascending: false });
  if (filter) query = query.eq("status", filter);
  const { data } = await query;
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Facturas de ComisionaTe</h1>
      <nav aria-label="Filtrar por estado" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(([v, label]) => (
          <Link key={label} href={v ? `/admin/facturas?estado=${v}` : "/admin/facturas"} aria-current={(filter ?? "") === v ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${(filter ?? "") === v ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-surface"}`}>{label}</Link>
        ))}
      </nav>
      <ul className="space-y-3">
        {(data ?? []).map((i) => (
          <li key={i.id} className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{i.number} · {(i.companies as unknown as { legal_name: string }).legal_name}</p>
                <p className="text-sm text-muted">Emitida {dateEs(i.issued_at)} · {i.paid_at ? `pagada ${dateEs(i.paid_at)}` : `vence ${dateEs(i.due_at)}`}{i.dunning_stage > 0 && !i.paid_at && ` · escalado ${i.dunning_stage}/3`}</p>
                <a href={`/api/facturas/${i.id}`} className="text-sm text-link underline underline-offset-4">Descargar PDF</a>
              </div>
              <div className="text-right"><p className="text-xl font-semibold">{euros(i.total_cents)}</p><p className="text-xs font-semibold capitalize">{i.status}</p></div>
            </div>
            {!i.paid_at && <MarkInvoicePaid invoiceId={i.id} />}
          </li>
        ))}
        {!data?.length && <p className="text-muted">No hay facturas.</p>}
      </ul>
    </>
  );
}
