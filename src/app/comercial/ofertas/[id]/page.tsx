import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { amountLabel, euros } from "@/lib/format";
import { Checkbox, buttonClass } from "@/components/form";
import { joinOffer } from "../../actions";
import { Badges, Rating, type CompanyStats } from "@/components/Badges";
import { ReportForm } from "@/components/TrustWidgets";

export const metadata: Metadata = { title: "Detalle de la oferta" };

const STATUS_TEXT: Record<string, string> = {
  activa: "Ya participas en esta oferta.",
  pendiente: "Tu solicitud está pendiente de aprobación por la empresa.",
  rechazada: "La empresa ha rechazado tu solicitud.",
  desactivada: "Tu código está desactivado.",
};

export default async function OfferDetailPage({ params, searchParams }: PageProps<"/comercial/ofertas/[id]">) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: offer } = await supabase
    .from("offers")
    .select("*, companies!inner(id, owner_id, legal_name, description, website, zone)")
    .eq("id", id)
    .single();
  if (!offer || offer.status !== "activa") notFound();

  const [{ data: membership }, { data: materials }] = await Promise.all([
    supabase.from("memberships").select("referral_code, status").eq("offer_id", id).maybeSingle(),
    supabase.from("offer_materials").select("id, name, path").eq("offer_id", id),
  ]);
  const links = await Promise.all((materials ?? []).map(async (m) => ({
    ...m, url: (await supabase.storage.from("materials").createSignedUrl(m.path, 3600)).data?.signedUrl,
  })));
  const company = offer.companies as unknown as { id: string; owner_id: string; legal_name: string; description: string; website: string | null; zone: string };
  const { data: statRows } = await supabase.rpc("company_public_stats", { p_companies: [company.id] });
  const stats = (statRows?.[0] ?? null) as CompanyStats | null;
  const errorText = error === "acepta" ? "Debes aceptar las condiciones para unirte." : error;

  return (
    <article className="max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-muted">{company.legal_name}</p>
        {stats && <div className="mt-1 flex flex-wrap items-center gap-2"><Badges stats={stats} /><Rating rating={stats.rating === null ? null : Number(stats.rating)} reviews={stats.reviews} /></div>}
        <h1 className="text-2xl font-semibold">{offer.title}</h1>
      </header>
      <p className="whitespace-pre-line">{offer.description}</p>

      <section aria-labelledby="condiciones" className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h2 id="condiciones" className="text-lg font-semibold">Condiciones</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
          {offer.lead_kind && (<><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Comisión por lead</dt><dd className="mb-2 sm:mb-0">{amountLabel(offer.lead_kind, offer.lead_value!)} cuando se realiza la visita técnica. Se paga en 15 días.</dd></>)}
          {offer.sale_kind && (<><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Comisión por venta</dt><dd className="mb-2 sm:mb-0">{amountLabel(offer.sale_kind, offer.sale_value!)} cuando el cliente firma. Tras 14 días de cancelación es firme y se paga en 15 días más.</dd></>)}
          {offer.product_price_cents != null && (<><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Precio orientativo</dt><dd className="mb-2 sm:mb-0">{euros(offer.product_price_cents)}</dd></>)}
          <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Zona</dt><dd className="mb-2 sm:mb-0">{offer.zones.length ? offer.zones.join(", ") : "Toda España"}</dd>
          {offer.requirements && (<><dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Requisitos</dt><dd className="mb-2 sm:mb-0">{offer.requirements}</dd></>)}
          <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Quién puede unirse</dt><dd className="mb-2 sm:mb-0">{offer.only_autonomos ? "Solo autónomos" : "Autónomos y particulares"}</dd>
          <dt className="text-sm font-semibold text-muted sm:text-base sm:text-foreground">Acceso</dt><dd className="mb-2 sm:mb-0">{offer.access === "abierto" ? "Inmediato" : "La empresa aprueba cada solicitud"}</dd>
        </dl>
        <p className="text-sm text-muted">Cobras la comisión íntegra: ComisionaTe nunca te descuenta nada. La empresa te paga directamente.</p>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium">Normas de conducta</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No te hagas pasar por compañía eléctrica ni administración.</li>
            <li>No prometas ahorros, subvenciones ni precios que la empresa no haya confirmado.</li>
            <li>Registra solo clientes que te han dado su consentimiento y con datos reales.</li>
            <li>No firmes contratos en nombre de la empresa ni cobres dinero al cliente.</li>
          </ul>
        </details>
      </section>

      {links.length > 0 && (
        <section aria-labelledby="material">
          <h2 id="material" className="mb-2 text-lg font-semibold">Material de venta</h2>
          <ul className="space-y-1">{links.map((m) => <li key={m.id}><a href={m.url} target="_blank" rel="noreferrer" className="text-link underline underline-offset-4">{m.name}</a></li>)}</ul>
        </section>
      )}

      {membership ? (
        <section className="rounded-xl border border-primary p-4">
          <p className="font-medium">{STATUS_TEXT[membership.status]}</p>
          {membership.status !== "rechazada" && <p className="mt-1">Tu código: <strong className="font-mono">{membership.referral_code}</strong></p>}
          <Link href="/comercial/codigos" className="mt-3 inline-block text-link underline underline-offset-4">Ver mis códigos</Link>
        </section>
      ) : (
        <form action={joinOffer} className="space-y-3">
          <input type="hidden" name="offer_id" value={id} />
          <Checkbox name="accept" label="He leído y acepto las condiciones de esta oferta y las normas de conducta." hint="Guardamos una copia de estas condiciones: si la empresa las cambia, a ti te seguirán aplicando estas." />
          {errorText && <p role="alert" className="text-sm text-danger">{errorText}</p>}
          <button className={buttonClass}>Unirme y obtener mi código</button>
        </form>
      )}
    <ReportForm targetProfileId={company.owner_id} label="Reportar a esta empresa" />
    </article>
  );
}
