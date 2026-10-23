export type CommissionStatus = "pendiente" | "exigible" | "pagada_empresa" | "recibida" | "no_recibida" | "anulada";

export const COMMISSION_LABEL: Record<CommissionStatus, string> = {
  pendiente: "En periodo de cancelación",
  exigible: "Pendiente de pago",
  pagada_empresa: "Pagada por la empresa",
  recibida: "Cobrada",
  no_recibida: "Reclamada: no recibida",
  anulada: "Anulada",
};

/** Punto de color de la etiqueta: ámbar = pendiente, verde = pagada/cobrada, rojo = reclamada, gris = anulada. */
export const COMMISSION_TONE: Record<CommissionStatus, string> = {
  pendiente: "bg-amber",
  exigible: "bg-amber",
  pagada_empresa: "bg-success",
  recibida: "bg-success",
  no_recibida: "bg-danger",
  anulada: "bg-ash",
};

/** Agrupa para el dashboard del comercial: aún no firme / firme por cobrar / cobrado. */
export function bucket(status: CommissionStatus): "pendiente" | "confirmada" | "cobrada" | null {
  if (status === "pendiente") return "pendiente";
  if (status === "exigible" || status === "pagada_empresa" || status === "no_recibida") return "confirmada";
  if (status === "recibida") return "cobrada";
  return null;
}
