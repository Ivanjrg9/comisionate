import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anon, loginAs, membershipOf, registerLead, service } from "./helpers";

const db = service();
let admin: SupabaseClient, empresa2: SupabaseClient, com5: SupabaseClient, com2: SupabaseClient;

beforeAll(async () => {
  [admin, empresa2, com5, com2] = await Promise.all([
    loginAs("admin@comisionate.test"), loginAs("empresa2@comisionate.test"),
    loginAs("comercial5@comisionate.test"), loginAs("comercial2@comisionate.test"),
  ]);
});

const profileId = async (email: string) => (await db.from("profiles").select("id").eq("email", email).single()).data!.id as string;
const companyId = async (name: string) => (await db.from("companies").select("id").eq("legal_name", name).single()).data!.id as string;

describe("permisos de administración", () => {
  it("solo el admin puede usar las funciones de admin", async () => {
    const target = await profileId("comercial8@comisionate.test");
    for (const client of [com5, empresa2, anon()]) {
      expect((await client.rpc("admin_set_account_status", { p_profile: target, p_status: "suspendido" })).error).not.toBeNull();
      expect((await client.rpc("admin_verify_company", { p_company: await companyId("Fotón Hogar"), p_verify: false })).error).not.toBeNull();
    }
  });
  it("el admin no puede tocar a otros admins ni a sí mismo", async () => {
    const me = await profileId("admin@comisionate.test");
    expect((await admin.rpc("admin_set_account_status", { p_profile: me, p_status: "suspendido" })).error?.message).toMatch(/propia cuenta/);
  });
});

describe("verificar, suspender y expulsar", () => {
  const COMPANY = "Verde Sur Instalaciones";
  afterAll(async () => {
    await admin.rpc("admin_set_account_status", { p_profile: (await db.from("companies").select("owner_id").eq("legal_name", COMPANY).single()).data!.owner_id, p_status: "activo" });
  });

  it("suspender oculta las ofertas y bloquea el acceso; reactivar lo devuelve todo", async () => {
    const co = (await db.from("companies").select("id, owner_id").eq("legal_name", COMPANY).single()).data!;
    await db.from("offers").update({ status: "activa" }).eq("company_id", co.id);
    expect((await admin.rpc("admin_set_account_status", { p_profile: co.owner_id, p_status: "suspendido" })).error).toBeNull();
    expect((await db.from("companies").select("status, suspension_reason").eq("id", co.id).single()).data).toEqual({ status: "suspendida", suspension_reason: "admin" });
    expect((await db.from("offers").select("status").eq("company_id", co.id)).data!.every((o) => o.status === "oculta")).toBe(true);
    expect((await db.from("profiles").select("status").eq("id", co.owner_id).single()).data!.status).toBe("suspendido");

    expect((await admin.rpc("admin_set_account_status", { p_profile: co.owner_id, p_status: "activo" })).error).toBeNull();
    expect((await db.from("companies").select("status").eq("id", co.id).single()).data!.status).toBe("verificada");
    expect((await db.from("offers").select("status").eq("company_id", co.id)).data!.every((o) => o.status === "activa")).toBe(true);
  });

  it("verificar / quitar verificación y fijar tarifas por empresa", async () => {
    const id = await companyId(COMPANY);
    expect((await admin.rpc("admin_verify_company", { p_company: id, p_verify: false })).error).toBeNull();
    expect((await db.from("companies").select("status").eq("id", id).single()).data!.status).toBe("pendiente");
    await admin.rpc("admin_verify_company", { p_company: id, p_verify: true });
    expect((await admin.rpc("admin_update_company_terms", { p_company: id, p_founder_until: null, p_fee: 6.5 })).error).toBeNull();
    expect((await db.rpc("fee_percent_for", { p_company: id })).data).toBe(6.5);
    await admin.rpc("admin_update_company_terms", { p_company: id, p_founder_until: null, p_fee: 8 });
  });
});

describe("disputas", () => {
  async function rejectedLead() {
    const id = (await registerLead(com5, await membershipOf(com5, "Kit solar Madrid"))).lead_id!;
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "rechazado", p_reason: "datos_falsos" });
    return id;
  }

  it("el comercial abre una disputa en un lead rechazado; solo una abierta a la vez; ajenos no", async () => {
    const id = await rejectedLead();
    expect((await com2.from("disputes").insert({ lead_id: id, opened_by: await profileId("comercial2@comisionate.test"), explanation: "x" })).error).not.toBeNull();
    const mine = { lead_id: id, opened_by: await profileId("comercial5@comisionate.test"), explanation: "Los datos eran reales" };
    expect((await com5.from("disputes").insert(mine)).error).toBeNull();
    expect((await com5.from("disputes").insert(mine)).error).not.toBeNull();
    expect((await db.from("notifications").select("id").eq("kind", "disputa_nueva")).data!.length).toBeGreaterThan(0);
    await com5.from("disputes").select("id").eq("lead_id", id).single().then(async ({ data }) =>
      expect((await admin.rpc("admin_resolve_dispute", { p_dispute: data!.id, p_for_salesperson: false, p_resolution: "Confirmado: datos falsos" })).error).toBeNull());
    expect((await com5.from("leads").select("status").eq("id", id).single()).data!.status).toBe("rechazado");
  });

  it("a favor del comercial, un lead rechazado vuelve a «registrado»", async () => {
    const id = await rejectedLead();
    const { data: d } = await com5.from("disputes").insert({ lead_id: id, opened_by: await profileId("comercial5@comisionate.test"), explanation: "Error" }).select("id").single();
    expect((await empresa2.rpc("admin_resolve_dispute", { p_dispute: d!.id, p_for_salesperson: true, p_resolution: "x" })).error).not.toBeNull();
    expect((await admin.rpc("admin_resolve_dispute", { p_dispute: d!.id, p_for_salesperson: true, p_resolution: "Tiene razón" })).error).toBeNull();
    expect((await com5.from("leads").select("status, reject_reason").eq("id", id).single()).data).toEqual({ status: "registrado", reject_reason: null });
    expect((await com5.from("disputes").select("status").eq("id", d!.id).single()).data!.status).toBe("resuelta_comercial");
    const { data: ev } = await com5.from("lead_events").select("to_status, reason").eq("lead_id", id).order("id");
    expect(ev!.at(-1)!.reason).toMatch(/a favor del comercial/);
  });

  it("a favor del comercial, una venta cancelada recupera su comisión", async () => {
    const id = (await registerLead(com5, await membershipOf(com5, "Kit solar Madrid"))).lead_id!;
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "lead_cualificado" });
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "venta", p_amount: 1000000 });
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "cancelada", p_note: "falso" });
    const { data: d } = await com5.from("disputes").insert({ lead_id: id, opened_by: await profileId("comercial5@comisionate.test"), explanation: "Nunca canceló" }).select("id").single();
    await admin.rpc("admin_resolve_dispute", { p_dispute: d!.id, p_for_salesperson: true, p_resolution: "Venta válida" });
    expect((await com5.from("leads").select("status").eq("id", id).single()).data!.status).toBe("periodo_cancelacion");
    expect((await com5.from("commissions").select("status").eq("lead_id", id).eq("type", "venta").single()).data!.status).toBe("pendiente");
  });
});

describe("reportes y sanciones", () => {
  it("aviso → suspensión → expulsión sobre un comercial", async () => {
    const target = await profileId("comercial10@comisionate.test");
    const reporter = await profileId("comercial5@comisionate.test");
    const { data: r } = await com5.from("reports").insert({ reporter_id: reporter, target_profile_id: target, reason: "Prometió ahorros falsos" }).select("id").single();
    expect((await com2.from("reports").select("id").eq("id", r!.id)).data).toHaveLength(0);

    expect((await admin.rpc("admin_start_report_review", { p_report: r!.id })).error).toBeNull();
    expect((await admin.rpc("admin_resolve_report", { p_report: r!.id, p_sanction: "aviso", p_note: "Primer aviso" })).error).toBeNull();
    expect((await db.from("reports").select("status, sanction").eq("id", r!.id).single()).data).toEqual({ status: "resuelto", sanction: "aviso" });
    expect((await admin.rpc("admin_resolve_report", { p_report: r!.id, p_sanction: "ninguna", p_note: "x" })).error).not.toBeNull();

    await admin.rpc("admin_set_account_status", { p_profile: target, p_status: "suspendido" });
    expect((await db.from("profiles").select("status").eq("id", target).single()).data!.status).toBe("suspendido");
    await admin.rpc("admin_set_account_status", { p_profile: target, p_status: "expulsado" });
    const { count } = await db.from("memberships").select("id", { count: "exact", head: true }).eq("salesperson_id", target).in("status", ["activa", "pendiente"]);
    expect(count).toBe(0);
    await admin.rpc("admin_set_account_status", { p_profile: target, p_status: "activo" });
  });
});

describe("valoraciones", () => {
  it("solo tras una comisión pagada, una por parte, y el destinatario lo fija el servidor", async () => {
    const com = com5;
    const id = (await registerLead(com, await membershipOf(com, "Kit solar Madrid"))).lead_id!;
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "lead_cualificado" });
    const commission = (await com.from("commissions").select("id").eq("lead_id", id).single()).data!.id;

    expect((await com.rpc("submit_review", { p_commission: commission, p_stars: 5 })).error?.message).toMatch(/comisión pagada/);
    await empresa2.rpc("company_mark_paid", { p_commission: commission });
    await com.rpc("salesperson_confirm_payment", { p_commission: commission, p_received: true });

    expect((await com.rpc("submit_review", { p_commission: commission, p_stars: 6 })).error).not.toBeNull();
    expect((await com2.rpc("submit_review", { p_commission: commission, p_stars: 5 })).error?.message).toMatch(/No participas/);
    expect((await com.rpc("submit_review", { p_commission: commission, p_stars: 4, p_comment: "Pagaron rápido" })).error).toBeNull();
    expect((await empresa2.rpc("submit_review", { p_commission: commission, p_stars: 5, p_comment: "Buen trabajo" })).error).toBeNull();
    expect((await com.rpc("submit_review", { p_commission: commission, p_stars: 1 })).error?.message).toMatch(/Ya has valorado/);

    const { data } = await db.from("reviews").select("author_id, target_id, stars").eq("commission_id", commission);
    const empresaOwner = (await db.from("companies").select("owner_id").eq("legal_name", "Fotón Hogar").single()).data!.owner_id;
    const comId = await profileId("comercial5@comisionate.test");
    expect(data).toEqual(expect.arrayContaining([
      { author_id: comId, target_id: empresaOwner, stars: 4 }, { author_id: empresaOwner, target_id: comId, stars: 5 },
    ]));
    // Insertar directamente ya no es posible
    expect((await com.from("reviews").insert({ commission_id: commission, author_id: comId, target_id: comId, stars: 5 })).error).not.toBeNull();
  });
});

describe("insignias públicas de empresa", () => {
  it("verificada, fundadora y buen pagador (0 retrasos y alguna comisión cobrada)", async () => {
    const ids = [await companyId("SolMed Energía"), await companyId("Verde Sur Instalaciones")];
    const { data } = await com5.rpc("company_public_stats", { p_companies: ids });
    const by = new Map((data as { company_id: string; verified: boolean; founder: boolean; good_payer: boolean }[]).map((r) => [r.company_id, r]));
    expect(by.get(ids[0])).toMatchObject({ verified: true, founder: true, good_payer: true });
    expect(by.get(ids[1])).toMatchObject({ founder: false, good_payer: false }); // tiene un retraso registrado
  });
});
