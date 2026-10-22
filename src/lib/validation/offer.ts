import { z } from "zod";

/** "7,5" o "7.5" → 7.5; vacío → undefined. */
const decimal = z.preprocess((v) => {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  return Number(v.replace(",", "."));
}, z.number("Escribe un número").nonnegative("No puede ser negativo").optional());

const kind = z.enum(["fija", "porcentaje"]);

export const offerSchema = z
  .object({
    title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres").max(120),
    description: z.string().trim().max(4000).default(""),
    sector_id: z.coerce.number().int().positive("Elige un sector"),
    product_price: decimal,
    lead_enabled: z.string().optional(),
    lead_kind: kind.optional(),
    lead_value: decimal,
    sale_enabled: z.string().optional(),
    sale_kind: kind.optional(),
    sale_value: decimal,
    zones: z.string().default(""),
    requirements: z.string().trim().max(2000).default(""),
    only_autonomos: z.string().optional(),
    access: z.enum(["abierto", "aprobacion"]),
    status: z.enum(["borrador", "activa", "pausada"]),
  })
  .superRefine((v, ctx) => {
    if (!v.lead_enabled && !v.sale_enabled)
      ctx.addIssue({ code: "custom", path: ["lead_enabled"], message: "Activa al menos una comisión (por lead o por venta)" });
    for (const p of ["lead", "sale"] as const) {
      if (!v[`${p}_enabled`]) continue;
      const value = v[`${p}_value`];
      if (!v[`${p}_kind`]) ctx.addIssue({ code: "custom", path: [`${p}_kind`], message: "Elige fija o porcentaje" });
      if (!value || value <= 0) ctx.addIssue({ code: "custom", path: [`${p}_value`], message: "Indica una cuantía mayor que 0" });
      else if (v[`${p}_kind`] === "porcentaje" && value > 100)
        ctx.addIssue({ code: "custom", path: [`${p}_value`], message: "Un porcentaje no puede superar 100" });
      if (v[`${p}_kind`] === "porcentaje" && p === "lead" && !v.product_price)
        ctx.addIssue({ code: "custom", path: ["product_price"], message: "El % por lead se calcula sobre el precio del producto" });
    }
  });

export type OfferInput = z.infer<typeof offerSchema>;

/** Convierte el formulario a la fila de BD: euros → céntimos, % → puntos básicos. */
export function toOfferRow(v: OfferInput) {
    const side = (p: "lead" | "sale") => {
    if (!v[`${p}_enabled`]) return { [`${p}_kind`]: null, [`${p}_value`]: null };
    return { [`${p}_kind`]: v[`${p}_kind`]!, [`${p}_value`]: Math.round(v[`${p}_value`]! * 100) };
  };
  return {
    title: v.title,
    description: v.description,
    sector_id: v.sector_id,
    product_price_cents: v.product_price != null ? Math.round(v.product_price * 100) : null,
    ...side("lead"),
    ...side("sale"),
    zones: v.zones.split(/[,\n]/).map((z) => z.trim()).filter(Boolean),
    requirements: v.requirements,
    only_autonomos: !!v.only_autonomos,
    access: v.access,
    status: v.status,
  };
}
