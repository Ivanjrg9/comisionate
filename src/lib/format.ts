const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const eurInt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export const euros = (cents: number) => (cents % 100 === 0 ? eurInt : eur).format(cents / 100);

export const dateEs = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

export type AmountKind = "fija" | "porcentaje";

/** 5000 céntimos → "50 €"; 400 puntos básicos → "4 %". */
export function amountLabel(kind: AmountKind, value: number) {
  return kind === "fija" ? euros(value) : `${(value / 100).toLocaleString("es-ES")} %`;
}
