import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { dateEs } from "@/lib/format";
import { CopyButton } from "./CopyButton";

export const metadata: Metadata = { title: "Mis códigos" };

const STATUS: Record<string, string> = { activa: "Activo", pendiente: "Pendiente de aprobación", rechazada: "Rechazado", desactivada: "Desactivado" };

export default async function CodesPage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, referral_code, status, accepted_at, offers(title, companies(legal_name))")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Mis códigos de referido</h1>
      {!memberships?.length ? (
        <p className="text-muted">Aún no te has unido a ninguna oferta. <Link href="/comercial/ofertas" className="font-semibold text-primary underline">Ver ofertas</Link></p>
      ) : (
        <ul className="space-y-3">
          {memberships.map((m) => {
            const offer = m.offers as unknown as { title: string; companies: { legal_name: string } };
            const message = `Hola, te recomiendo ${offer.companies.legal_name} para tu instalación solar. Si te interesa, dime y te paso con ellos. Mi código: ${m.referral_code}`;
            return (
              <li key={m.id} className="rounded-xl border border-border p-4">
                <p className="font-semibold">{offer.title}</p>
                <p className="text-sm text-muted">{offer.companies.legal_name} · {STATUS[m.status]} · desde {dateEs(m.accepted_at)}</p>
                {m.status === "activa" && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <code className="rounded-lg bg-surface px-3 py-2 text-lg font-bold tracking-wide">{m.referral_code}</code>
                    <CopyButton text={m.referral_code} />
                    <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"
                       className="inline-flex min-h-10 items-center rounded-lg bg-[#25D366] px-4 font-semibold text-neutral-900">
                      Compartir por WhatsApp
                    </a>
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
