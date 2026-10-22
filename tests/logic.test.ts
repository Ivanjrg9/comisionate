import { describe, expect, it, beforeAll } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loginAs, membershipOf, randomPhone, registerLead, service } from "./helpers";

const KIT = "Kit solar Madrid"; // empresa2: lead fijo 75 €, venta 4 %, tarifa global 10 %
const RESIDENCIAL = "Instalación solar residencial"; // empresa1 fundadora: tarifa 0 %

let empresa2: SupabaseClient, empresa1: SupabaseClient, com5: SupabaseClient, com3: SupabaseClient;

beforeAll(async () => {
  [empresa2, empresa1, com5, com3] = await Promise.all([
    loginAs("empresa2@comisionate.test"), loginAs("empresa1@comisionate.test"),
    loginAs("comercial5@comisionate.test"), loginAs("comercial3@comisionate.test"),
  ]);
});

describe("funciones puras", () => {
  const db = service();
  it("normaliza teléfonos españoles a E.164", async () => {
    for (const [raw, expected] of [["600 11 22 33", "+34600112233"], ["+34 600112233", "+34600112233"], ["0034600112233", "+34600112233"], ["123", null]]) {
      const { data } = await db.rpc("normalize_phone", { p_raw: raw });
      expect(data).toBe(expected);
    }
  });
  it("calcula comisiones fijas y porcentuales en céntimos", async () => {
    expect((await db.rpc("calc_commission_cents", { p_kind: "fija", p_value: 5000, p_base_cents: null })).data).toBe(5000);
    expect((await db.rpc("calc_commission_cents", { p_kind: "porcentaje", p_value: 400, p_base_cents: 1000000 })).data).toBe(40000);
  });
});

describe("ciclo de vida de una venta", () => {
  let leadId: string;

  it("registra un cliente y normaliza el teléfono", async () => {
    const r = await registerLead(com5, await membershipOf(com5, KIT), "611 22 33 44");
    expect(r.ok).toBe(true);
    leadId = r.lead_id!;
    const { data } = await com5.from("leads").select("phone_e164, status").eq("id", leadId).single();
    expect(data).toEqual({ phone_e164: "+34611223344", status: "registrado" });
    await service().from("leads").update({ phone_e164: "+34" + randomPhone() }).eq("id", leadId); // libera el teléfono para repetir tests
  });

  it("rechaza saltarse estados y exige motivo al rechazar", async () => {
    const bad = await empresa2.rpc("set_lead_status", { p_lead: leadId, p_to: "venta", p_amount: 100 });
    expect(bad.error?.message).toMatch(/Transición no permitida/);
    const noReason = await empresa2.rpc("set_lead_status", { p_lead: leadId, p_to: "rechazado" });
    expect(noReason.error?.message).toMatch(/motivo/);
  });

  it("cualificar genera la comisión por lead con la tarifa del 10 %", async () => {
    const { error } = await empresa2.rpc("set_lead_status", { p_lead: leadId, p_to: "lead_cualificado" });
    expect(error).toBeNull();
    const { data } = await empresa2.from("commissions").select("*").eq("lead_id", leadId).single();
    expect(data).toMatchObject({ type: "lead", amount_cents: 7500, fee_percent: 10, fee_cents: 750, status: "exigible" });
    const days = (new Date(data!.due_at).getTime() - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(14.9);
    expect(days).toBeLessThan(15.1);
  });

  it("marcar venta calcula el 4 % y abre 14 días de cancelación", async () => {
    const { error } = await empresa2.rpc("set_lead_status", { p_lead: leadId, p_to: "venta", p_amount: 1000000 });
    expect(error).toBeNull();
    const { data: lead } = await empresa2.from("leads").select("status, cancel_ends_at").eq("id", leadId).single();
    expect(lead!.status).toBe("periodo_cancelacion");
    expect((new Date(lead!.cancel_ends_at).getTime() - Date.now()) / 864e5).toBeCloseTo(14, 1);
    const { data: c } = await empresa2.from("commissions").select("*").eq("lead_id", leadId).eq("type", "venta").single();
    expect(c).toMatchObject({ amount_cents: 40000, fee_cents: 4000, status: "pendiente" });
  });

  it("no confirma antes de tiempo y confirma pasados 14 días", async () => {
    const db = service();
    await db.rpc("confirm_due_sales");
    expect((await db.from("leads").select("status").eq("id", leadId).single()).data!.status).toBe("periodo_cancelacion");

    await db.from("leads").update({ cancel_ends_at: new Date(Date.now() - 1000).toISOString() }).eq("id", leadId);
    expect((await db.rpc("confirm_due_sales")).data).toBeGreaterThanOrEqual(1);
    expect((await db.from("leads").select("status").eq("id", leadId).single()).data!.status).toBe("confirmada");
    const { data: c } = await db.from("commissions").select("status, due_at").eq("lead_id", leadId).eq("type", "venta").single();
    expect(c!.status).toBe("exigible");
    expect((new Date(c!.due_at).getTime() - Date.now()) / 864e5).toBeCloseTo(15, 1);
  });

  it("pago: empresa marca pagado y el comercial confirma → lead pagada", async () => {
    const { data: comms } = await empresa2.from("commissions").select("id").eq("lead_id", leadId);
    for (const { id } of comms!) {
      expect((await empresa2.rpc("company_mark_paid", { p_commission: id })).error).toBeNull();
      expect((await com5.rpc("salesperson_confirm_payment", { p_commission: id, p_received: true })).error).toBeNull();
    }
    expect((await com5.from("leads").select("status").eq("id", leadId).single()).data!.status).toBe("pagada");
  });

  it("guarda el historial de cambios", async () => {
    const { data } = await com5.from("lead_events").select("to_status").eq("lead_id", leadId).order("id");
    expect(data!.map((e) => e.to_status)).toEqual(["registrado", "lead_cualificado", "venta", "periodo_cancelacion", "confirmada"]);
  });
});

describe("cancelación y rechazo", () => {
  it("cancelar durante el periodo anula la comisión por venta pero no la de lead", async () => {
    const id = (await registerLead(com5, await membershipOf(com5, KIT))).lead_id!;
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "lead_cualificado" });
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "venta", p_amount: 500000 });
    expect((await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "cancelada", p_note: "Desistimiento" })).error).toBeNull();
    const { data } = await empresa2.from("commissions").select("type, status").eq("lead_id", id).order("type");
    expect(data).toEqual([{ type: "lead", status: "exigible" }, { type: "venta", status: "anulada" }]);
  });

  it("la empresa fundadora no paga el 10 %", async () => {
    const m = await membershipOf(com5, RESIDENCIAL);
    const id = (await registerLead(com5, m)).lead_id!;
    await empresa1.rpc("set_lead_status", { p_lead: id, p_to: "lead_cualificado" });
    const { data } = await empresa1.from("commissions").select("fee_percent, fee_cents, amount_cents").eq("lead_id", id).single();
    expect(data).toEqual({ fee_percent: 0, fee_cents: 0, amount_cents: 5000 });
  });
});

describe("cliente reservado (90 días)", () => {
  it("bloquea a otro comercial, avisa sin revelar datos y permite tras rechazo", async () => {
    const phone = randomPhone();
    const first = await registerLead(com5, await membershipOf(com5, KIT), phone);
    expect(first.ok).toBe(true);

    const second = await registerLead(com3, await membershipOf(com3, KIT), phone);
    expect(second).toEqual({ ok: false, reason: "cliente_reservado" });
    const { data: notes } = await com3.from("notifications").select("kind, body").eq("kind", "cliente_reservado");
    expect(notes!.length).toBeGreaterThan(0);
    expect(JSON.stringify(notes)).not.toContain(phone);

    await empresa2.rpc("set_lead_status", { p_lead: first.lead_id, p_to: "rechazado", p_reason: "cliente_no_interesado" });
    expect((await registerLead(com3, await membershipOf(com3, KIT), phone)).ok).toBe(true);
  });

  it("detecta el mismo teléfono con otro formato", async () => {
    const phone = randomPhone();
    await registerLead(com5, await membershipOf(com5, KIT), phone);
    const r = await registerLead(com3, await membershipOf(com3, KIT), `+34 ${phone}`);
    expect(r.reason).toBe("cliente_reservado");
  });

  it("exige consentimiento", async () => {
    const { error } = await com5.rpc("register_lead", {
      p_membership: await membershipOf(com5, KIT), p_name: "X", p_phone: randomPhone(), p_email: "",
      p_postal: "", p_municipality: "", p_property: "", p_notes: "", p_consent: false,
    });
    expect(error?.message).toMatch(/consentimiento/);
  });
});

describe("rechazos y estados finales", () => {
  it("«otro» exige explicación y un rechazado ya no cambia de estado", async () => {
    const id = (await registerLead(com5, await membershipOf(com5, KIT))).lead_id!;
    const noNote = await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "rechazado", p_reason: "otro" });
    expect(noNote.error?.message).toMatch(/Explica/);
    expect((await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "rechazado", p_reason: "otro", p_note: "No contesta" })).error).toBeNull();
    for (const to of ["lead_cualificado", "venta", "cancelada"]) {
      expect((await empresa2.rpc("set_lead_status", { p_lead: id, p_to: to, p_amount: 1 })).error?.message).toMatch(/Transición no permitida/);
    }
    const { data } = await com5.from("lead_events").select("to_status, reason").eq("lead_id", id).order("id");
    expect(data!.at(-1)).toEqual({ to_status: "rechazado", reason: "otro: No contesta" });
  });

  it("solo se puede cancelar durante el periodo de cancelación", async () => {
    const id = (await registerLead(com5, await membershipOf(com5, KIT))).lead_id!;
    await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "lead_cualificado" });
    expect((await empresa2.rpc("set_lead_status", { p_lead: id, p_to: "cancelada" })).error?.message).toMatch(/Transición no permitida/);
  });
});
