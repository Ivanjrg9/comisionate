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
