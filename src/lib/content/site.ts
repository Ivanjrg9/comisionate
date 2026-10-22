export const SITE = {
  name: "ComisionaTe",
  tagline: "Tu red de comerciales a comisión",
  domain: "comisionate.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://comisionate.com",
};

/**
 * Datos del titular para los textos legales. Rellénalos antes de publicar (o define las variables de entorno).
 * Mientras LEGAL_DRAFT sea true, las páginas legales muestran un aviso de «pendiente de revisión».
 */
export const LEGAL = {
  draft: true,
  entity: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "[DENOMINACIÓN SOCIAL DEL TITULAR]",
  taxId: process.env.NEXT_PUBLIC_LEGAL_TAX_ID ?? "[CIF/NIF]",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "[DOMICILIO SOCIAL]",
  registry: process.env.NEXT_PUBLIC_LEGAL_REGISTRY ?? "[DATOS DEL REGISTRO MERCANTIL, si procede]",
  email: process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "[EMAIL DE CONTACTO]",
  updated: "22 de octubre de 2026",
  /** Versión de los términos y la política de privacidad que se guarda al registrarse. Cámbiala cuando cambien los textos. */
  version: "2026-10-22",
};

/** Plazos y porcentajes del modelo de negocio (los mismos que usa la base de datos). */
export const RULES = {
  feePercent: 10,
  founderMonths: 3,
  cancelDays: 14,
  payDays: 15,
  reserveDays: 90,
  respondDays: 15,
};
