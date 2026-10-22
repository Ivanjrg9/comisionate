import { describe, expect, it } from "vitest";
import { loginAs, membershipOf, registerLead, service } from "./helpers";

const db = service();
const stamp = Date.now();

async function newUser(role: "comercial" | "empresa", meta: Record<string, string> = {}) {
  const email = `${role}.h${stamp}.${Math.random().toString(36).slice(2, 7)}@comisionate.test`;
  const { data, error } = await db.auth.admin.createUser({
    email, password: "Comisionate123!", email_confirm: true,
    user_metadata: { role, full_name: `Test ${role}`, fiscal: "autonomo", nif: "12345678Z", legal_name: "Hardening SL", cif: "B12312312", ...meta },
  });
  if (error) throw error;
  return { id: data.user.id, email };
}

describe("registro de la aceptación de términos", () => {
  it("guarda versión y fecha al registrarse, y nadie puede falsearlas después", async () => {
    const { id, email } = await newUser("comercial", { terms_version: "2026-10-22" });
    const { data } = await db.from("profiles").select("terms_version, terms_accepted_at").eq("id", id).single();
    expect(data!.terms_version).toBe("2026-10-22");
    expect(Date.now() - new Date(data!.terms_accepted_at).getTime()).toBeLessThan(60_000);

    const client = await loginAs(email);
    expect((await client.from("profiles").update({ terms_version: "falsa" }).eq("id", id)).error).not.toBeNull();
    await client.rpc("accept_terms", { p_version: "otra" }); // ya aceptados: no sobrescribe
    expect((await db.from("profiles").select("terms_version").eq("id", id).single()).data!.terms_version).toBe("2026-10-22");
  });

  it("accept_terms registra la aceptación de quien entra con Google (sin términos previos)", async () => {
    const { id, email } = await newUser("comercial");
    expect((await db.from("profiles").select("terms_accepted_at").eq("id", id).single()).data!.terms_accepted_at).toBeNull();
    const client = await loginAs(email);
    expect((await client.rpc("accept_terms", { p_version: "2026-10-22" })).error).toBeNull();
    expect((await db.from("profiles").select("terms_version").eq("id", id).single()).data!.terms_version).toBe("2026-10-22");
  });
});

describe("cuentas no activas", () => {
  it("un comercial suspendido con la sesión abierta no puede registrar clientes", async () => {
    const { id, email } = await newUser("comercial");
    const client = await loginAs(email);
    const offer = (await db.from("offers").select("id").eq("title", "Kit solar Madrid").single()).data!.id;
    expect((await client.rpc("join_offer", { p_offer: offer })).error).toBeNull();
    const membership = await membershipOf(client, "Kit solar Madrid");
    expect((await registerLead(client, membership)).ok).toBe(true);

    await db.from("profiles").update({ status: "suspendido" }).eq("id", id);
    await expect(registerLead(client, membership)).rejects.toMatchObject({ message: expect.stringMatching(/no está activa/) });
  });
});

describe("una empresa castigada no puede reactivar sus ofertas", () => {
  it("con una factura impagada de 26 días no puede volver a poner «activa» una oferta; al pagar sí", async () => {
    const { id, email } = await newUser("empresa");
    const company = (await db.from("companies").select("id").eq("owner_id", id).single()).data!.id;
    const sector = (await db.from("sectors").select("id").eq("slug", "solar").single()).data!.id;
    await db.from("companies").update({ status: "verificada", verified_at: new Date().toISOString(), sector_id: sector }).eq("id", company);
    const { data: offer } = await db.from("offers").insert({ company_id: company, sector_id: sector, title: "Oferta castigada", status: "pausada", lead_kind: "fija", lead_value: 1000 }).select("id").single();
    const { data: invoice } = await db.from("platform_invoices").insert({
      company_id: company, period: "2026-02-01", number: `CT-H-${stamp}`, total_cents: 500, status: "emitida",
      issued_at: new Date(Date.now() - 26 * 864e5).toISOString(), due_at: new Date(Date.now() - 11 * 864e5).toISOString(),
    }).select("id").single();

    const client = await loginAs(email);
    const blocked = await client.from("offers").update({ status: "activa" }).eq("id", offer!.id);
    expect(blocked.error?.message).toMatch(/pagos pendientes/);

    const admin = await loginAs("admin@comisionate.test");
    expect((await admin.rpc("admin_mark_invoice_paid", { p_invoice: invoice!.id })).error).toBeNull();
    expect((await client.from("offers").update({ status: "activa" }).eq("id", offer!.id)).error).toBeNull();
  });

  it("tampoco puede publicar ofertas si ha solicitado la baja", async () => {
    const { id, email } = await newUser("empresa");
    const company = (await db.from("companies").select("id").eq("owner_id", id).single()).data!.id;
    const sector = (await db.from("sectors").select("id").eq("slug", "solar").single()).data!.id;
    await db.from("companies").update({ status: "verificada", verified_at: new Date().toISOString(), sector_id: sector }).eq("id", company);
    const { data: offer } = await db.from("offers").insert({ company_id: company, sector_id: sector, title: "Oferta en baja", status: "pausada", lead_kind: "fija", lead_value: 1000 }).select("id").single();
    const client = await loginAs(email);
    expect((await client.rpc("request_company_leave")).error).toBeNull();
    expect((await client.from("offers").update({ status: "activa" }).eq("id", offer!.id)).error?.message).toMatch(/baja/);
  });
});

describe("avisos al administrador", () => {
  it("una empresa nueva genera un aviso «por verificar» para los admins", async () => {
    const { id } = await newUser("empresa", { legal_name: `Aviso ${stamp} SL` });
    const company = (await db.from("companies").select("id").eq("owner_id", id).single()).data!.id;
    const admin = (await db.from("profiles").select("id").eq("role", "admin").single()).data!.id;
    const { data } = await db.from("notifications").select("link, body").eq("user_id", admin).eq("kind", "empresa_nueva").eq("body", `Aviso ${stamp} SL`);
    expect(data).toEqual([{ link: `/admin/empresas/${company}`, body: `Aviso ${stamp} SL` }]);
  });
});
