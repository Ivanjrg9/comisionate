import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loginAs, membershipOf, registerLead, service } from "./helpers";

const db = service();
const day = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const FOTON = "Fotón Hogar"; // tarifa 10 %
const SOLMED = "SolMed Energía"; // fundadora: 0 %

const companyId = async (name: string) => (await db.from("companies").select("id").eq("legal_name", name).single()).data!.id as string;
const ownerOf = async (id: string) => (await db.from("companies").select("owner_id").eq("id", id).single()).data!.owner_id as string;
const notes = async (userId: string, kind: string) => (await db.from("notifications").select("id").eq("user_id", userId).eq("kind", kind)).data!.length;

describe("factura mensual de ComisionaTe", () => {
  const period = "2026-10-01";
  beforeAll(async () => {
    // Estado limpio: sin facturas de ese mes (se desvinculan sus comisiones).
    const { data: old } = await db.from("platform_invoices").select("id").eq("period", period);
    for (const { id } of old ?? []) {
      await db.from("commissions").update({ platform_invoice_id: null }).eq("platform_invoice_id", id);
      await db.from("platform_invoices").delete().eq("id", id);
    }
  });

  it("suma el 10 % por empresa, no factura a la fundadora y es idempotente", async () => {
    const created = (await db.rpc("generate_monthly_invoices", { p_period: period })).data as number;
    expect(created).toBeGreaterThanOrEqual(1);

    const { data: invoices } = await db.from("platform_invoices").select("id, company_id, total_cents, due_at, issued_at, number").eq("period", period);
    const solmed = await companyId(SOLMED);
    expect(invoices!.some((i) => i.company_id === solmed)).toBe(false);
    for (const inv of invoices!) {
      const { data: comms } = await db.from("commissions").select("fee_cents").eq("platform_invoice_id", inv.id);
      expect(inv.total_cents).toBe(comms!.reduce((n, c) => n + c.fee_cents, 0));
      expect(inv.number).toMatch(/^CT-202610-\d{4}$/);
      expect((new Date(inv.due_at).getTime() - new Date(inv.issued_at).getTime()) / 864e5).toBeCloseTo(15, 1);
    }
    const fotonId = await companyId(FOTON);
    expect(invoices!.some((i) => i.company_id === fotonId)).toBe(true);

    expect((await db.rpc("generate_monthly_invoices", { p_period: period })).data).toBe(0);
    expect(await notes(await ownerOf(fotonId), "factura_emitida")).toBeGreaterThan(0);
  });

  it("no factura comisiones sin tarifa ni las todavía no firmes", async () => {
    const { data: pending } = await db.from("commissions").select("platform_invoice_id").eq("status", "pendiente");
    expect(pending!.every((c) => c.platform_invoice_id === null)).toBe(true);
    const { data: free } = await db.from("commissions").select("platform_invoice_id").eq("fee_cents", 0);
    expect(free!.every((c) => c.platform_invoice_id === null)).toBe(true);
  });
});

describe("plazos de respuesta de la empresa", () => {
  it("avisa a los 15 días y pasa a revisión del admin 7 días después", async () => {
    const com = await loginAs("comercial5@comisionate.test");
    const id = (await registerLead(com, await membershipOf(com, "Kit solar Madrid"))).lead_id!;
    const owner = await ownerOf(await companyId(FOTON));
    const before = await notes(owner, "lead_sin_respuesta");

    await db.from("leads").update({ created_at: day(14) }).eq("id", id);
    await db.rpc("process_overdue");
    expect((await db.from("leads").select("warned_at").eq("id", id).single()).data!.warned_at).toBeNull();

    await db.from("leads").update({ created_at: day(16) }).eq("id", id);
    await db.rpc("process_overdue");
    expect((await db.from("leads").select("warned_at, needs_review").eq("id", id).single()).data!.warned_at).not.toBeNull();
    expect(await notes(owner, "lead_sin_respuesta")).toBeGreaterThanOrEqual(before + 1);

    await db.from("leads").update({ warned_at: day(8) }).eq("id", id);
    await db.rpc("process_overdue");
    expect((await db.from("leads").select("needs_review").eq("id", id).single()).data!.needs_review).toBe(true);
    const admin = (await db.from("profiles").select("id").eq("role", "admin").single()).data!.id;
    expect(await notes(admin, "lead_revision")).toBeGreaterThan(0);
    await db.from("leads").update({ status: "rechazado", reject_reason: "otro" }).eq("id", id);
  });
});

describe("impago de la empresa al comercial", () => {
  let empresa: SupabaseClient, com: SupabaseClient, commission: string, company: string;

  beforeAll(async () => {
    empresa = await loginAs("empresa2@comisionate.test");
    com = await loginAs("comercial5@comisionate.test");
    company = await companyId(FOTON);
    const lead = (await registerLead(com, await membershipOf(com, "Kit solar Madrid"))).lead_id!;
    await empresa.rpc("set_lead_status", { p_lead: lead, p_to: "lead_cualificado" });
    commission = (await com.from("commissions").select("id").eq("lead_id", lead).single()).data!.id;
    await empresa.rpc("company_mark_paid", { p_commission: commission });
    await com.rpc("salesperson_confirm_payment", { p_commission: commission, p_received: false });
  });
  afterAll(async () => {
    await db.from("commissions").update({ status: "recibida", not_received_at: null }).eq("id", commission);
    await db.from("offers").update({ status: "activa" }).eq("company_id", company).eq("status", "oculta");
  });

  const stage = async () => (await db.from("commissions").select("dunning_stage").eq("id", commission).single()).data!.dunning_stage;
  const age = (days: number) => db.from("commissions").update({ not_received_at: day(days) }).eq("id", commission);

  it("+3 días: aviso", async () => {
    await age(4);
    await db.rpc("process_overdue");
    expect(await stage()).toBe(1);
    expect((await db.from("offers").select("status").eq("company_id", company)).data!.some((o) => o.status === "oculta")).toBe(false);
  });

  it("+10 días: segundo aviso, ofertas ocultas y +1 impago", async () => {
    const lates = (await db.from("companies").select("late_payments").eq("id", company).single()).data!.late_payments;
    await age(11);
    await db.rpc("process_overdue");
    expect(await stage()).toBe(2);
    expect((await db.from("offers").select("status").eq("company_id", company)).data!.every((o) => o.status === "oculta")).toBe(true);
    expect((await db.from("companies").select("late_payments").eq("id", company).single()).data!.late_payments).toBe(lates + 1);
    expect((await db.rpc("company_in_default", { p_company: company })).data).toBe(true);
  });

  it("+15 días: revisión del admin", async () => {
    await age(16);
    await db.rpc("process_overdue");
    expect(await stage()).toBe(3);
    const admin = (await db.from("profiles").select("id").eq("role", "admin").single()).data!.id;
    expect(await notes(admin, "impago_revision")).toBeGreaterThan(0);
  });

  it("al volver a pagar se reactivan las ofertas", async () => {
    expect((await empresa.rpc("company_mark_paid", { p_commission: commission })).error).toBeNull();
    expect((await db.from("offers").select("status").eq("company_id", company)).data!.some((o) => o.status === "oculta")).toBe(false);
    expect((await db.rpc("company_in_default", { p_company: company })).data).toBe(false);
  });
});

describe("factura de ComisionaTe sin pagar", () => {
  let invoice: string, company: string;
  const age = (days: number) => db.from("platform_invoices").update({ issued_at: day(days), due_at: day(days - 15) }).eq("id", invoice);
  const state = async () => ({
    inv: (await db.from("platform_invoices").select("status, dunning_stage").eq("id", invoice).single()).data!,
    co: (await db.from("companies").select("status").eq("id", company).single()).data!.status,
    hidden: (await db.from("offers").select("status").eq("company_id", company)).data!.some((o) => o.status === "oculta"),
  });

  beforeAll(async () => {
    company = await companyId(FOTON);
    const { data } = await db.from("platform_invoices").insert({
      company_id: company, period: "2026-01-01", number: "CT-TEST-0001", total_cents: 1000, status: "emitida", due_at: day(-15),
    }).select("id").single();
    invoice = data!.id;
  });
  afterAll(async () => {
    await db.from("platform_invoices").delete().eq("id", invoice);
    await db.from("offers").update({ status: "activa" }).eq("company_id", company).eq("status", "oculta");
    await db.from("companies").update({ status: "verificada", suspension_reason: null }).eq("id", company);
  });

  it("a los 15 días queda vencida; no bloquea todavía", async () => {
    await age(16);
    await db.rpc("process_overdue");
    expect(await state()).toMatchObject({ inv: { status: "vencida", dunning_stage: 1 }, co: "verificada", hidden: false });
  });

  it("a los 25 días oculta ofertas e impide validar ventas nuevas", async () => {
    // El cliente ya estaba registrado (oferta activa) cuando llega el bloqueo.
    const com = await loginAs("comercial5@comisionate.test");
    const lead = (await registerLead(com, await membershipOf(com, "Kit solar Madrid"))).lead_id!;

    await age(26);
    await db.rpc("process_overdue");
    expect(await state()).toMatchObject({ inv: { dunning_stage: 2 }, co: "verificada", hidden: true });

    const empresa = await loginAs("empresa2@comisionate.test");
    const res = await empresa.rpc("set_lead_status", { p_lead: lead, p_to: "lead_cualificado" });
    expect(res.error?.message).toMatch(/factura de ComisionaTe vencida/);
    await db.from("leads").update({ status: "rechazado", reject_reason: "otro" }).eq("id", lead);
  });

  it("a los 30 días suspende la cuenta y al pagar la factura se reactiva todo", async () => {
    await age(31);
    await db.rpc("process_overdue");
    expect(await state()).toMatchObject({ inv: { dunning_stage: 3 }, co: "suspendida" });

    const admin = await loginAs("admin@comisionate.test");
    expect((await admin.rpc("admin_mark_invoice_paid", { p_invoice: invoice })).error).toBeNull();
    expect(await state()).toMatchObject({ inv: { status: "pagada" }, co: "verificada", hidden: false });
  });

  it("solo el admin puede marcar facturas como pagadas", async () => {
    const empresa = await loginAs("empresa2@comisionate.test");
    expect((await empresa.rpc("admin_mark_invoice_paid", { p_invoice: invoice })).error?.message).toMatch(/administrador/);
  });
});
