import { describe, expect, it } from "vitest";
import { FAQ } from "../src/lib/content/faq";
import { RULES } from "../src/lib/content/site";
import { service } from "./helpers";

describe("textos públicos", () => {
  it("los plazos y la tarifa publicados coinciden con los de la base de datos", async () => {
    const { data } = await service().from("app_settings").select("key, value");
    const db = Object.fromEntries((data ?? []).map((s) => [s.key, Number(s.value)]));
    expect(RULES).toMatchObject({
      feePercent: db.fee_percent, cancelDays: db.cancel_days, payDays: db.pay_days,
      reserveDays: db.reserve_days, respondDays: db.respond_days,
    });
  });

  it("las preguntas frecuentes cubren las dudas exigidas", () => {
    const text = FAQ.map((f) => f.q.toLowerCase()).join("\n");
    for (const must of ["autónomo", "cuándo cobro", "cliente cancela", "cuánto cuesta para una empresa", "empresa no me paga"]) {
      expect(text).toContain(must);
    }
    expect(FAQ.every((f) => f.a.length > 40)).toBe(true);
  });
});

import { anon } from "./helpers";
import { ilikeAny, pageParams, PAGE_SIZE } from "../src/lib/pagination";

describe("marketplace público (RLS para anónimos)", () => {
  it("un anónimo ve solo ofertas activas y ningún dato de personas ni materiales", async () => {
    const a = anon();
    const { data } = await a.from("offers").select("id, status");
    expect((data ?? []).length).toBeGreaterThan(0);
    expect((data ?? []).every((o) => o.status === "activa")).toBe(true);
    for (const t of ["leads", "memberships", "commissions", "offer_materials", "profiles", "salespeople"]) {
      expect((await a.from(t).select("*")).data ?? []).toHaveLength(0);
    }
  });

  it("las insignias públicas están disponibles sin sesión", async () => {
    const a = anon();
    const { data: offers } = await a.from("offers").select("company_id").limit(5);
    const { data, error } = await a.rpc("company_public_stats", { p_companies: [...new Set((offers ?? []).map((o) => o.company_id))] });
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });
});

describe("paginación y búsqueda", () => {
  it("calcula el rango y descarta páginas inválidas", () => {
    expect(pageParams({ pagina: "3" })).toMatchObject({ page: 3, from: 2 * PAGE_SIZE, to: 3 * PAGE_SIZE - 1 });
    for (const bad of ["0", "-4", "abc", undefined]) expect(pageParams({ pagina: bad }).page).toBe(1);
  });
  it("limpia el texto de búsqueda para no romper el filtro de PostgREST", () => {
    const { q } = pageParams({ q: "Ana, (García)%*'; drop" });
    expect(q).not.toMatch(/[,()%*';]/);
    expect(ilikeAny(["a", "b"], "x")).toBe("a.ilike.%x%,b.ilike.%x%");
  });
});
