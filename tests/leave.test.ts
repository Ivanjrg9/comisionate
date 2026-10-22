import { describe, expect, it } from "vitest";
import { anon, loginAs, membershipOf, registerLead, service } from "./helpers";

const db = service();
const stamp = Date.now();

async function newUser(role: "comercial" | "empresa", extra: Record<string, string> = {}) {
  const email = `${role}.${stamp}.${Math.random().toString(36).slice(2, 7)}@comisionate.test`;
  const { data, error } = await db.auth.admin.createUser({
    email, password: "Comisionate123!", email_confirm: true,
    user_metadata: { role, full_name: `Test ${role}`, fiscal: "autonomo", nif: "12345678Z", ...extra },
  });
  if (error) throw error;
  return { id: data.user.id, email };
}

describe("baja de un comercial", () => {
  it("sin nada pendiente, la cuenta se cierra y se anonimiza al momento", async () => {
    const { id, email } = await newUser("comercial");
    const client = await loginAs(email);
    const offer = (await db.from("offers").select("id").eq("title", "Kit solar Madrid").single()).data!.id;
    await client.rpc("join_offer", { p_offer: offer });
    const lead = (await registerLead(client, await membershipOf(client, "Kit solar Madrid"))).lead_id!;
    await db.from("salespeople").update({ iban: "ES9121000418450200051999", nif: "12345678Z" }).eq("id", id);

    expect((await client.rpc("request_salesperson_leave")).data).toBe("cerrada");

    const { data: p } = await db.from("profiles").select("status, full_name, email, anonymized_at").eq("id", id).single();
    expect(p).toMatchObject({ status: "baja", full_name: "Usuario dado de baja" });
    expect(p!.email).toMatch(/@anonimo\.invalid$/);
    expect(p!.anonymized_at).not.toBeNull();
    expect((await db.from("salespeople").select("nif, iban").eq("id", id).single()).data).toEqual({ nif: null, iban: null });
    expect((await db.from("leads").select("customer_name, email, phone_e164").eq("id", lead).single()).data).toMatchObject({ customer_name: "Cliente anonimizado", email: null });
    // el registro de la venta se conserva
    expect((await db.from("leads").select("id").eq("id", lead)).data).toHaveLength(1);
    // ya no puede entrar
    expect((await anon().auth.signInWithPassword({ email, password: "Comisionate123!" })).error).not.toBeNull();
  });

  it("con comisiones pendientes: códigos desactivados, cuenta abierta hasta cobrar, y no puede unirse a más ofertas", async () => {
    const { id, email } = await newUser("comercial");
    const client = await loginAs(email);
    const empresa = await loginAs("empresa2@comisionate.test");
    const offer = (await db.from("offers").select("id").eq("title", "Kit solar Madrid").single()).data!.id;
    await client.rpc("join_offer", { p_offer: offer });
    const lead = (await registerLead(client, await membershipOf(client, "Kit solar Madrid"))).lead_id!;
    await empresa.rpc("set_lead_status", { p_lead: lead, p_to: "lead_cualificado" });

    expect((await client.rpc("request_salesperson_leave")).data).toBe("en_curso");
    expect((await db.from("profiles").select("status").eq("id", id).single()).data!.status).toBe("activo");
    expect((await db.from("memberships").select("status").eq("salesperson_id", id)).data!.every((m) => m.status === "desactivada")).toBe(true);
    const other = (await db.from("offers").select("id").eq("title", "Instalación solar residencial").single()).data!.id;
    expect((await client.rpc("join_offer", { p_offer: other })).error?.message).toMatch(/baja/);

    await db.rpc("finalize_leaves");
    expect((await db.from("profiles").select("status").eq("id", id).single()).data!.status).toBe("activo");

    const commission = (await client.from("commissions").select("id").eq("lead_id", lead).single()).data!.id;
    await empresa.rpc("company_mark_paid", { p_commission: commission });
    await client.rpc("salesperson_confirm_payment", { p_commission: commission, p_received: true });
    await db.rpc("finalize_leaves");
    expect((await db.from("profiles").select("status").eq("id", id).single()).data!.status).toBe("baja");
    // el pago cobrado se conserva
    expect((await db.from("commissions").select("status").eq("id", commission).single()).data!.status).toBe("recibida");
  });
});

describe("baja de una empresa", () => {
  it("se bloquea con comisiones o facturas pendientes", async () => {
    const empresa = await loginAs("empresa2@comisionate.test"); // tiene comisiones exigibles en el seed
    expect((await empresa.rpc("request_company_leave")).error?.message).toMatch(/todo pagado/);
  });

  it("con todo pagado: ofertas cerradas, comerciales avisados y cierre tras 90 días", async () => {
    const { id, email } = await newUser("empresa", { legal_name: "Baja SL", cif: "B99999999" });
    const company = (await db.from("companies").select("id").eq("owner_id", id).single()).data!.id;
    const sector = (await db.from("sectors").select("id").eq("slug", "solar").single()).data!.id;
    await db.from("companies").update({ status: "verificada", verified_at: new Date().toISOString(), sector_id: sector }).eq("id", company);
    const { data: offer } = await db.from("offers").insert({ company_id: company, sector_id: sector, title: "Oferta de baja", status: "activa", lead_kind: "fija", lead_value: 1000 }).select("id").single();
    const com = await newUser("comercial");
    const comClient = await loginAs(com.email);
    await comClient.rpc("join_offer", { p_offer: offer!.id });

    const client = await loginAs(email);
    expect((await client.rpc("request_company_leave")).error).toBeNull();
    expect((await db.from("offers").select("status").eq("id", offer!.id).single()).data!.status).toBe("cerrada");
    expect((await db.from("notifications").select("id").eq("user_id", com.id).eq("kind", "empresa_baja")).data!.length).toBe(1);
    expect((await client.rpc("request_company_leave")).error?.message).toMatch(/Ya has solicitado/);

    await db.rpc("finalize_leaves");
    expect((await db.from("companies").select("status").eq("id", company).single()).data!.status).toBe("verificada");

    await db.from("companies").update({ baja_requested_at: new Date(Date.now() - 91 * 864e5).toISOString() }).eq("id", company);
    await db.rpc("finalize_leaves");
    expect((await db.from("companies").select("status, description").eq("id", company).single()).data).toEqual({ status: "baja", description: "" });
    expect((await db.from("profiles").select("status").eq("id", id).single()).data!.status).toBe("baja");
    // se conservan los datos fiscales de la empresa (obligación legal)
    expect((await db.from("companies").select("legal_name, cif").eq("id", company).single()).data).toEqual({ legal_name: "Baja SL", cif: "B99999999" });
  });

  it("los usuarios no pueden darse de baja «por la puerta de atrás»", async () => {
    const { id, email } = await newUser("comercial");
    const client = await loginAs(email);
    expect((await client.from("profiles").update({ status: "baja" }).eq("id", id)).error).not.toBeNull();
    expect((await client.from("profiles").update({ leaving_at: new Date().toISOString() }).eq("id", id)).error).not.toBeNull();
  });
});
