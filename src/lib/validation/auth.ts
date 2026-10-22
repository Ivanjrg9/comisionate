import { z } from "zod";

const email = z.email("Escribe un email válido");
export const passwordSchema = z
  .string()
  .regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, "La contraseña debe tener al menos 8 caracteres, con letras y números");
const password = passwordSchema;

export const loginSchema = z.object({ email, password: z.string().min(1, "Escribe tu contraseña") });

export const registerSchema = z
  .object({
    role: z.enum(["empresa", "comercial"]),
    full_name: z.string().trim().min(2, "Escribe tu nombre"),
    email,
    password,
    legal_name: z.string().trim().optional(),
    cif: z.string().trim().optional(),
    fiscal: z.enum(["autonomo", "particular"]).optional(),
    nif: z.string().trim().optional(),
    terms: z.literal("on", "Debes aceptar los términos y la política de privacidad"),
  })
  .superRefine((v, ctx) => {
    if (v.role === "empresa") {
      if (!v.legal_name) ctx.addIssue({ code: "custom", path: ["legal_name"], message: "Escribe la razón social" });
      if (!v.cif || !/^[A-Za-z]\d{7}[A-Za-z0-9]$/.test(v.cif))
        ctx.addIssue({ code: "custom", path: ["cif"], message: "CIF no válido (ej. B12345678)" });
    } else {
      if (!v.fiscal) ctx.addIssue({ code: "custom", path: ["fiscal"], message: "Indica si eres autónomo o particular" });
      if (!v.nif || !/^([0-9]{8}|[XYZxyz][0-9]{7})[A-Za-z]$/.test(v.nif))
        ctx.addIssue({ code: "custom", path: ["nif"], message: "DNI/NIE no válido (ej. 12345678A)" });
    }
  });

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };
