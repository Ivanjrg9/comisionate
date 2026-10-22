import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSectors } from "@/lib/data";
import { dateEs } from "@/lib/format";
import { secondaryButtonClass } from "@/components/form";
import { OfferForm } from "../OfferForm";
import { MaterialUpload } from "./MaterialUpload";
import { Rating } from "@/components/Badges";
import { ReportForm } from "@/components/TrustWidgets";
import { deleteMaterial, setMembershipStatus } from "../../actions";

export const metadata: Metadata = { title: "Editar oferta" };

export default async function EditOfferPage({ params }: PageProps<"/empresa/ofertas/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: offer } = await supabase.from("offers").select("*").eq("id", id).single();
  if (!offer) notFound();

  const [sectors, { data: materials }, { data: members, error: membersError }] = await Promise.all([
    getSectors(),
    supabase.from("offer_materials").select("id, name, path").eq("offer_id", id).order("created_at"),
    supabase
      .from("memberships")
      .select("id, status, referral_code, accepted_at, salesperson_id, salespeople(fiscal, zone, profiles(full_name))")
      .eq("offer_id", id)
      .order("created_at"),
  ]);
  if (membersError) throw new Error(membersError.message);
  const memberIds = (members ?? []).map((m) => m.salesperson_id);
  const { data: reviewRows } = memberIds.length ? await supabase.from("reviews").select("target_id, stars").in("target_id", memberIds) : { data: [] };
  const rating = (id: string) => {
    const rows = (reviewRows ?? []).filter((r) => r.target_id === id);
    return { avg: rows.length ? Math.round((rows.reduce((n, r) => n + r.stars, 0) / rows.length) * 10) / 10 : null, n: rows.length };
  };
  const links = await Promise.all((materials ?? []).map(async (m) => ({
    ...m, url: (await supabase.storage.from("materials").createSignedUrl(m.path, 3600)).data?.signedUrl,
  })));
  const pending = members?.filter((m) => m.status === "pendiente") ?? [];

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h1 className="mb-6 text-2xl font-bold">{offer.title}</h1>
        <OfferForm offer={offer} sectors={sectors} />
      </section>

      <section aria-labelledby="materiales">
        <h2 id="materiales" className="mb-3 text-xl font-bold">Material de venta</h2>
        {links.length > 0 && (
          <ul className="mb-4 space-y-2">
            {links.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <a href={m.url} target="_blank" rel="noreferrer" className="font-medium text-primary underline">{m.name}</a>
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="text-sm text-danger underline">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <MaterialUpload offerId={id} />
      </section>

      <section aria-labelledby="comerciales">
        <h2 id="comerciales" className="mb-3 text-xl font-bold">Comerciales</h2>
        {pending.length > 0 && <p className="mb-3 rounded-lg bg-accent/30 p-3 text-sm">Tienes {pending.length} solicitud(es) pendiente(s) de aprobar.</p>}
        {!members?.length ? (
          <p className="text-muted">Aún no se ha unido ningún comercial.</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => {
              const sp = m.salespeople as unknown as { fiscal: string; zone: string; profiles: { full_name: string } } | null;
              const profile = sp?.profiles;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium">{profile?.full_name} <Rating rating={rating(m.salesperson_id).avg} reviews={rating(m.salesperson_id).n} /></p>
                    <p className="text-sm text-muted">
                      {sp?.fiscal === "autonomo" ? "Autónomo" : "Particular"}{sp?.zone && ` · ${sp.zone}`} · {m.referral_code} · {dateEs(m.accepted_at)} · {m.status}
                    </p>
                  </div>
                  <ReportForm targetProfileId={m.salesperson_id} label="Reportar" />
                  {m.status === "pendiente" && (
                    <form action={setMembershipStatus} className="flex gap-2">
                      <input type="hidden" name="id" value={m.id} />
                      <button name="status" value="activa" className="min-h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">Aprobar</button>
                      <button name="status" value="rechazada" className={`${secondaryButtonClass} !min-h-9 !px-3 !py-1 text-sm`}>Rechazar</button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
