import { describe, expect, it, beforeAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loginAs, membershipOf, registerLead, service } from "./helpers";

const RESIDENCIAL = "Instalación solar residencial"; // empresa1 (SolMed)
let empresa1: SupabaseClient, empresa2: SupabaseClient, com1: SupabaseClient, com5: SupabaseClient;
let commissionId: string;

beforeAll(async () => {
  [empresa1, empresa2, com1, com5] = await Promise.all([
    loginAs("empresa1@comisionate.test"), loginAs("empresa2@comisionate.test"),
    loginAs("comercial1@comisionate.test"), loginAs("comercial5@comisionate.test"),
  ]);
  const leadId = (await registerLead(com5, await membershipOf(com5, RESIDENCIAL))).lead_id!;
  await empresa1.rpc("set_lead_status", { p_lead: leadId, p_to: "lead_cualificado" });
  commissionId = (await com5.from("commissions").select("id").eq("lead_id", leadId).single()).data!.id;
});

describe("pagos entre empresa y comercial", () => {
  it("solo la empresa dueña marca el pago y solo el comercial lo confirma", async () => {
    expect((await empresa2.rpc("company_mark_paid", { p_commission: commissionId })).error).not.toBeNull();
    expect((await com5.rpc("company_mark_paid", { p_commission: commissionId })).error).not.toBeNull();
    expect((await com5.rpc("salesperson_confirm_payment", { p_commission: commissionId, p_received: true })).error?.message).toMatch(/pendiente de confirmar/);
    expect((await empresa1.rpc("company_mark_paid", { p_commission: commissionId })).error).toBeNull();
    expect((await empresa1.rpc("salesperson_confirm_payment", { p_commission: commissionId, p_received: true })).error).not.toBeNull();
  });

  it("«No recibido» permite a la empresa volver a marcar el pago", async () => {
    expect((await com5.rpc("salesperson_confirm_payment", { p_commission: commissionId, p_received: false })).error).toBeNull();
    expect((await com5.from("commissions").select("status").eq("id", commissionId).single()).data!.status).toBe("no_recibida");
    expect((await empresa1.rpc("company_mark_paid", { p_commission: commissionId })).error).toBeNull();
    expect((await com5.rpc("salesperson_confirm_payment", { p_commission: commissionId, p_received: true })).error).toBeNull();
    expect((await com5.from("commissions").select("status").eq("id", commissionId).single()).data!.status).toBe("recibida");
  });
});

describe("facturas de autónomos (Storage + RLS)", () => {
  const pdf = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
  let path: string;

  it("el comercial sube su factura y la empresa de la comisión la puede descargar", async () => {
    const uid = (await com5.auth.getUser()).data.user!.id;
    path = `${uid}/${commissionId}/factura.pdf`;
    expect((await com5.storage.from("invoices").upload(path, pdf, { upsert: true })).error).toBeNull();
    expect((await com5.from("salesperson_invoices").insert({ commission_id: commissionId, path })).error).toBeNull();
    expect((await empresa1.storage.from("invoices").createSignedUrl(path, 60)).data?.signedUrl).toBeTruthy();
  });

  it("otra empresa u otro comercial no ven ni suben nada en esa comisión", async () => {
    expect((await empresa2.storage.from("invoices").createSignedUrl(path, 60)).data).toBeNull();
    expect((await com1.storage.from("invoices").createSignedUrl(path, 60)).data).toBeNull();
    expect((await com1.from("salesperson_invoices").select("id").eq("commission_id", commissionId)).data).toHaveLength(0);
    expect((await com1.from("salesperson_invoices").insert({ commission_id: commissionId, path: "x" })).error).not.toBeNull();
    const intruso = (await com1.auth.getUser()).data.user!.id;
    expect((await com1.storage.from("invoices").upload(`${(await com5.auth.getUser()).data.user!.id}/robo.pdf`, pdf)).error).not.toBeNull();
    expect(intruso).toBeTruthy();
  });

  it("no se puede subir una segunda factura a la misma comisión", async () => {
    expect((await com5.from("salesperson_invoices").insert({ commission_id: commissionId, path: path + "2" })).error).not.toBeNull();
    await service().storage.from("invoices").remove([path]);
  });
});
