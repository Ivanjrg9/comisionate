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

/** Color del punto de la etiqueta: gris = inicio, ámbar = en curso, verde = firme/cobrado, rojo = cerrado sin éxito. */
export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  registrado: "bg-ash",
  lead_cualificado: "bg-amber",
  venta: "bg-amber",
  periodo_cancelacion: "bg-amber",
  confirmada: "bg-success",
  pagada: "bg-success",
  rechazado: "bg-danger",
  cancelada: "bg-danger",
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
