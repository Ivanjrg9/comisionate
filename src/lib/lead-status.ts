export type LeadStatus =
  | "registrado" | "lead_cualificado" | "venta" | "periodo_cancelacion"
  | "confirmada" | "pagada" | "rechazado" | "cancelada";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  registrado: "Registrado",
  lead_cualificado: "Lead cualificado",
  venta: "Venta",
  periodo_cancelacion: "En periodo de cancelación",
  confirmada: "Venta confirmada",
  pagada: "Pagada",
  rechazado: "Rechazado",
  cancelada: "Cancelada",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  registrado: "bg-surface text-foreground",
  lead_cualificado: "bg-accent/40 text-foreground",
  venta: "bg-primary/15 text-on-tint",
  periodo_cancelacion: "bg-accent/40 text-foreground",
  confirmada: "bg-primary/15 text-on-tint",
  pagada: "bg-primary text-primary-foreground",
  rechazado: "bg-danger/15 text-danger",
  cancelada: "bg-danger/15 text-danger",
};

export const REJECT_REASONS = {
  cliente_no_interesado: "Cliente no interesado",
  datos_falsos: "Datos falsos",
  duplicado: "Duplicado",
  fuera_de_zona: "Fuera de zona",
  otro: "Otro (explícalo)",
} as const;

export type RejectReason = keyof typeof REJECT_REASONS;

/** El motivo de rechazo se guarda como «clave» o «clave: nota»; lo presentamos legible. */
export function readableReason(reason: string | null) {
  if (!reason) return null;
  const [key, ...note] = reason.split(": ");
  const label = REJECT_REASONS[key as RejectReason];
  return label ? [label.replace(" (explícalo)", ""), ...note].join(": ") : reason;
}
