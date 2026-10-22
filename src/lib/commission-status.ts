export type CommissionStatus = "pendiente" | "exigible" | "pagada_empresa" | "recibida" | "no_recibida" | "anulada";

export const COMMISSION_LABEL: Record<CommissionStatus, string> = {
  pendiente: "En periodo de cancelación",
  exigible: "Pendiente de pago",
  pagada_empresa: "Pagada por la empresa",
  recibida: "Cobrada",
  no_recibida: "Reclamada: no recibida",
  anulada: "Anulada",
};

export const COMMISSION_TONE: Record<CommissionStatus, string> = {
  pendiente: "bg-accent/40",
  exigible: "bg-accent/40",
  pagada_empresa: "bg-primary/15 text-on-tint",
  recibida: "bg-primary text-primary-foreground",
  no_recibida: "bg-danger/15 text-danger",
  anulada: "bg-surface text-muted",
};

/** Agrupa para el dashboard del comercial: aún no firme / firme por cobrar / cobrado. */
export function bucket(status: CommissionStatus): "pendiente" | "confirmada" | "cobrada" | null {
  if (status === "pendiente") return "pendiente";
  if (status === "exigible" || status === "pagada_empresa" || status === "no_recibida") return "confirmada";
  if (status === "recibida") return "cobrada";
  return null;
}
