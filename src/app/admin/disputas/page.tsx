import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateEs } from "@/lib/format";
import { readableReason } from "@/lib/lead-status";
import { ResolveDispute } from "./ResolveForm";

export const metadata: Metadata = { title: "Disputas" };

const STATUS = { abierta: "Abierta", resuelta_comercial: "A favor del comercial", resuelta_empresa: "A favor de la empresa" } as const;

export default async function AdminDisputesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("disputes")
    .select("id, status, explanation, resolution, created_at, leads(id, customer_name, status, reject_reason, reject_note, offers(title, companies(legal_name))), profiles:opened_by(full_name)")
    .order("status")
    .order("created_at", { ascending: false });
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Disputas</h1>
      {!data?.length && <p className="text-muted">No hay disputas.</p>}
      <ul className="space-y-4">
        {(data ?? []).map((d) => {
          const l = d.leads as unknown as { id: string; customer_name: string; status: string; reject_reason: string | null; reject_note: string | null; offers: { title: string; companies: { legal_name: string } } };
          return (
            <li key={d.id} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold"><Link href={`/admin/leads/${l.id}`} className="underline">{l.customer_name}</Link> · {l.offers.title}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${d.status === "abierta" ? "bg-accent/40" : "bg-surface"}`}>{STATUS[d.status as keyof typeof STATUS]}</span>
              </div>
              <p className="text-sm text-muted">{l.offers.companies.legal_name} · abierta por {(d.profiles as unknown as { full_name: string }).full_name} el {dateEs(d.created_at)}</p>
              <p className="text-sm"><strong>Estado del lead:</strong> {l.status}{l.reject_reason && ` · motivo de la empresa: ${readableReason(l.reject_reason + (l.reject_note ? `: ${l.reject_note}` : ""))}`}</p>
              <blockquote className="border-l-4 border-border pl-3 text-sm">{d.explanation}</blockquote>
              {d.status === "abierta" ? <ResolveDispute disputeId={d.id} /> : <p className="text-sm"><strong>Decisión:</strong> {d.resolution}</p>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
