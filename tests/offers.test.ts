import { describe, expect, it } from "vitest";
import { estimatedCommissionCents } from "../src/lib/domain/offers";
import { amountLabel, euros } from "../src/lib/format";

describe("comisión orientativa", () => {
  it("suma lead fijo y venta porcentual sobre el precio", () => {
    expect(estimatedCommissionCents({ product_price_cents: 1200000, lead_kind: "fija", lead_value: 7500, sale_kind: "porcentaje", sale_value: 400 })).toBe(55500);
  });
  it("admite ofertas con una sola comisión", () => {
    expect(estimatedCommissionCents({ product_price_cents: null, lead_kind: null, lead_value: null, sale_kind: "fija", sale_value: 50000 })).toBe(50000);
  });
});

describe("formato", () => {
  it("etiqueta importes y porcentajes", () => {
    expect(amountLabel("porcentaje", 350)).toBe("3,5 %");
    expect(euros(5000).replace(/\s/g, " ")).toBe("50 €");
  });
});
