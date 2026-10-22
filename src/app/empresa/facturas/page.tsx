import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { dateEs, euros } from "@/lib/format";

export const metadata: Metadata = { title: "Facturas de ComisionaTe" };

const STATUS = { emitida: "Pendiente de pago", vencida: "Vencida", pagada: "Pagada" } as const;
const TONE = { emitida: "bg-accent/40", vencida: "bg-danger/15 text-danger", pagada: "bg-primary text-primary-foreground" } as const;

export default async function CompanyInvoicesPage() {
  const supabase = await createClient();
  const { data: invoices, error } = await supabase
    .from("platform_invoices")
    .select("id, number, period, total_cents, status, issued_at, due_at, paid_at")
    .order("period", { ascending: false });
  if (error) throw new Error(error.message);

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Facturas de ComisionaTe</h1>
      <p className="mb-6 max-w-2xl text-muted">
        A final de cada mes sumamos la tarifa de las comisiones que has validado. Pagas por transferencia en 15 días.
        Si la factura sigue sin pagar a los 25 días ocultamos tus ofertas y no podrás validar ventas nuevas; a los 30 se suspende la cuenta hasta que pagues.
      </p>
      {!invoices?.length ? (
        <p className="text-muted">Todavía no tienes facturas. Si eres empresa fundadora, tus primeros meses no llevan tarifa.</p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((i) => {
            const status = i.status as keyof typeof STATUS;
            return (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div>
                <p className="font-semibold">{i.number} · {new Date(i.period).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>
                <p className="text-sm text-muted">
                  Emitida el {dateEs(i.issued_at)} · {i.paid_at ? `pagada el ${dateEs(i.paid_at)}` : `vence el ${dateEs(i.due_at)}`}
                </p>
                <a href={`/api/facturas/${i.id}`} className="text-sm font-semibold text-primary underline">Descargar PDF</a>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold">{euros(i.total_cents)}</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${TONE[status]}`}>{STATUS[status]}</span>
              </div>
            </li>
          );})}
        </ul>
      )}
    </>
  );
}
