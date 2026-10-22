import { z } from "zod";

export const leadSchema = z.object({
  membership_id: z.uuid("Elige la oferta"),
  customer_name: z.string().trim().min(2, "Escribe el nombre del cliente"),
  phone: z.string().trim().refine((v) => /^(\+?34)?[6-9]\d{8}$/.test(v.replace(/[\s.-]/g, "")), "Teléfono no válido (9 cifras, ej. 600 11 22 33)"),
  email: z.union([z.literal(""), z.email("Email no válido")]).default(""),
  postal_code: z.union([z.literal(""), z.string().regex(/^\d{5}$/, "Código postal de 5 cifras")]).default(""),
  municipality: z.string().trim().max(100).default(""),
  property_type: z.string().trim().max(60).default(""),
  notes: z.string().trim().max(1000).default(""),
  consent: z.literal("on", "Necesitas el consentimiento del cliente para registrarlo"),
});

export const rejectSchema = z
  .object({
    reason: z.enum(["cliente_no_interesado", "datos_falsos", "duplicado", "fuera_de_zona", "otro"], "Elige un motivo"),
    note: z.string().trim().max(500).default(""),
  })
  .refine((v) => v.reason !== "otro" || v.note.length > 0, { path: ["note"], message: "Explica el motivo" });

export const saleSchema = z.object({
  amount: z.preprocess(
    (v) => (typeof v === "string" ? Number(v.replace(",", ".")) : v),
    z.number("Escribe el importe de la venta").positive("El importe debe ser mayor que 0"),
  ),
});
