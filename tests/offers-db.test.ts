import { afterAll, describe, expect, it } from "vitest";
import { loginAs, service } from "./helpers";

const db = service();
let offerId: string | undefined;

afterAll(async () => {
  if (offerId) {
    await db.from("memberships").delete().eq("offer_id", offerId);
    await db.from("offers").delete().eq("id", offerId);
  }
});

describe("unirse a una oferta", () => {
  it("guarda una copia inmutable de las condiciones aunque la empresa las cambie", async () => {
    const { data: company } = await db.from("companies").select("id, sector_id").eq("legal_name", "SolMed Energía").single();
    const { data: offer, error } = await db.from("offers").insert({
      company_id: company!.id, sector_id: company!.sector_id, title: "Oferta temporal de test", status: "activa",
      lead_kind: "fija", lead_value: 4000,
    }).select("id").single();
    expect(error).toBeNull();
    offerId = offer!.id;

    const com = await loginAs("comercial4@comisionate.test");
    const { data: m, error: joinError } = await com.rpc("join_offer", { p_offer: offerId });
    expect(joinError).toBeNull();
    expect(m.referral_code).toMatch(/^SOLAR-[A-Z]+-[A-Z0-9]{3}$/);
    expect(m.status).toBe("activa");
    expect(m.terms_snapshot.lead_value).toBe(4000);

    await db.from("offers").update({ lead_value: 9900 }).eq("id", offerId);
    const { data: after } = await com.from("memberships").select("terms_snapshot").eq("id", m.id).single();
    expect(after!.terms_snapshot.lead_value).toBe(4000);
  });

  it("no deja unirse dos veces a la misma oferta ni a una oferta pausada", async () => {
    const com = await loginAs("comercial4@comisionate.test");
    expect((await com.rpc("join_offer", { p_offer: offerId })).error).not.toBeNull();
    await db.from("offers").update({ status: "pausada" }).eq("id", offerId);
    const other = await loginAs("comercial5@comisionate.test");
    expect((await other.rpc("join_offer", { p_offer: offerId })).error?.message).toMatch(/no está disponible/);
  });

  it("una empresa no verificada no puede publicar ofertas", async () => {
    const { data: company } = await db.from("companies").select("id, sector_id").eq("legal_name", "SolMed Energía").single();
    await db.from("companies").update({ status: "pendiente" }).eq("id", company!.id);
    const { error } = await db.from("offers").update({ status: "activa" }).eq("id", offerId!);
    await db.from("companies").update({ status: "verificada" }).eq("id", company!.id);
    expect(error?.message).toMatch(/verificada/);
  });
});
