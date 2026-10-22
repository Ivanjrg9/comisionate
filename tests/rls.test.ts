import { describe, expect, it, beforeAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anon, loginAs } from "./helpers";

let empresa1: SupabaseClient, empresa2: SupabaseClient, com1: SupabaseClient, com2: SupabaseClient, admin: SupabaseClient;

beforeAll(async () => {
  [empresa1, empresa2, com1, com2, admin] = await Promise.all([
    loginAs("empresa1@comisionate.test"), loginAs("empresa2@comisionate.test"),
    loginAs("comercial1@comisionate.test"), loginAs("comercial2@comisionate.test"),
    loginAs("admin@comisionate.test"),
  ]);
});

const ids = async (c: SupabaseClient, table: string, col = "company_id") =>
  new Set(((await c.from(table).select(col)).data ?? []).map((r) => (r as unknown as Record<string, string>)[col]));

describe("RLS", () => {
  it("un anónimo no ve leads, comisiones ni ofertas", async () => {
    const a = anon();
    for (const t of ["leads", "commissions", "offers", "memberships", "profiles"]) {
      expect((await a.from(t).select("id")).data ?? []).toHaveLength(0);
    }
  });

  it("cada empresa solo ve sus leads y comisiones", async () => {
    const own1 = (await empresa1.from("companies").select("id").eq("owner_id", (await empresa1.auth.getUser()).data.user!.id).single()).data!.id;
    expect([...(await ids(empresa1, "leads"))]).toEqual([own1]);
    expect([...(await ids(empresa1, "commissions"))]).toEqual([own1]);
    expect(await ids(empresa2, "leads")).not.toContain(own1);
  });

  it("cada comercial solo ve los suyos", async () => {
    const uid = (c: SupabaseClient) => c.auth.getUser().then((r) => r.data.user!.id);
    for (const c of [com1, com2]) {
      expect([...(await ids(c, "leads", "salesperson_id"))]).toEqual([await uid(c)]);
      expect([...(await ids(c, "commissions", "salesperson_id"))]).toEqual([await uid(c)]);
    }
  });

  it("el admin lo ve todo", async () => {
    expect((await ids(admin, "leads")).size).toBe(3);
    expect(((await admin.from("leads").select("id")).data ?? []).length).toBeGreaterThanOrEqual(13);
  });

  it("un comercial no puede cambiar el estado de un lead ni escribir directamente", async () => {
    const { data: lead } = await com1.from("leads").select("id").eq("status", "registrado").limit(1).single();
    expect((await com1.rpc("set_lead_status", { p_lead: lead!.id, p_to: "lead_cualificado" })).error).not.toBeNull();
    await com1.from("leads").update({ status: "pagada" }).eq("id", lead!.id);
    expect((await com1.from("leads").select("status").eq("id", lead!.id).single()).data!.status).toBe("registrado");
    const { data: mine } = await com1.from("commissions").select("id, amount_cents").limit(1).single();
    await com1.from("commissions").update({ amount_cents: 99999999 }).eq("id", mine!.id);
    expect((await com1.from("commissions").select("amount_cents").eq("id", mine!.id).single()).data!.amount_cents).toBe(mine!.amount_cents);
  });

  it("una empresa no puede validar leads de otra", async () => {
    const { data: lead } = await empresa1.from("leads").select("id").eq("status", "registrado").limit(1).single();
    expect((await empresa2.rpc("set_lead_status", { p_lead: lead!.id, p_to: "lead_cualificado" })).error?.message).toMatch(/permiso/);
  });

  it("nadie se puede cambiar el rol ni el estado de su cuenta", async () => {
    const uid = (await com1.auth.getUser()).data.user!.id;
    const { error } = await com1.from("profiles").update({ role: "admin" }).eq("id", uid);
    expect(error?.message).toMatch(/rol/);
    expect((await empresa1.from("companies").update({ founder_until: "2099-01-01" }).eq("owner_id", (await empresa1.auth.getUser()).data.user!.id)).error).not.toBeNull();
  });

  it("el IBAN no se puede leer directamente y solo lo ve la empresa con comisiones pendientes", async () => {
    expect((await empresa1.from("salespeople").select("iban")).error).not.toBeNull();
    const { data: com3 } = await admin.from("profiles").select("id").eq("email", "comercial3@comisionate.test").single();
    // empresa3 tiene comisiones pendientes con comercial1 (impago); empresa2 no
    const { data: c1 } = await admin.from("profiles").select("id").eq("email", "comercial1@comisionate.test").single();
    const empresa3 = await loginAs("empresa3@comisionate.test");
    expect((await empresa3.rpc("get_salesperson_iban", { p_salesperson: c1!.id })).data).toMatch(/^ES/);
    expect((await empresa2.rpc("get_salesperson_iban", { p_salesperson: c1!.id })).data).toBeNull();
    expect((await empresa2.rpc("get_salesperson_iban", { p_salesperson: com3!.id })).data).toBeNull();
  });

  it("solo los comerciales pueden unirse a ofertas, respetando «solo autónomos»", async () => {
    const { data: offer } = await admin.from("offers").select("id").eq("title", "Autoconsumo para comunidades").single();
    const com8 = await loginAs("comercial8@comisionate.test"); // particular
    expect((await com8.rpc("join_offer", { p_offer: offer!.id })).error?.message).toMatch(/autónomos/);
    expect((await empresa1.rpc("join_offer", { p_offer: offer!.id })).error).not.toBeNull();
  });
});
