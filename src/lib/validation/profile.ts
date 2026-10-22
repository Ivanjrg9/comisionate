import { z } from "zod";

export const companyProfileSchema = z.object({
  legal_name: z.string().trim().min(2, "Escribe la razón social"),
  cif: z.string().trim().regex(/^[A-Za-z]\d{7}[A-Za-z0-9]$/, "CIF no válido (ej. B12345678)"),
  sector_id: z.coerce.number().int().positive("Elige un sector"),
  description: z.string().trim().max(2000).default(""),
  website: z.union([z.literal(""), z.url("Escribe una web válida, con https://")]).default(""),
  zone: z.string().trim().max(200).default(""),
  billing_address: z.string().trim().max(300).default(""),
  billing_email: z.union([z.literal(""), z.email("Email no válido")]).default(""),
});

export const salespersonProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Escribe tu nombre"),
  phone: z.string().trim().default(""),
  nif: z.string().trim().regex(/^([0-9]{8}|[XYZxyz][0-9]{7})[A-Za-z]$/, "DNI/NIE no válido (ej. 12345678A)"),
  fiscal: z.enum(["autonomo", "particular"]),
  new_autonomo: z.string().optional(),
  zone: z.string().trim().max(200).default(""),
  experience: z.string().trim().max(2000).default(""),
  iban: z.union([z.literal(""), z.string().trim().transform((s) => s.replace(/\s/g, "").toUpperCase()).pipe(z.string().regex(/^ES\d{22}$/, "IBAN español no válido (ES + 22 números)"))]).default(""),
});
