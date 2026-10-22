"use client";

import { ActionForm } from "@/components/ActionForm";
import { Checkbox } from "@/components/form";
import { leaveAsCompany, leaveAsSalesperson } from "@/lib/actions/leave";

export function LeaveAccount({ role }: { role: "comercial" | "empresa" }) {
  return (
    <details className="rounded-xl border border-border p-4">
      <summary className="cursor-pointer font-semibold text-danger">Darme de baja</summary>
      <div className="mt-3 space-y-3">
        {role === "comercial" ? (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Tus códigos se desactivan y no podrás registrar clientes nuevos.</li>
            <li>Conservas el derecho a cobrar todo lo que tengas en curso.</li>
            <li>La cuenta se cierra del todo cuando no quede nada pendiente. Entonces anonimizamos tus datos personales (conservamos los registros de ventas y pagos 6 años por obligación legal).</li>
          </ul>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Solo puedes darte de baja con todo pagado: comisiones, facturas de ComisionaTe y disputas.</li>
            <li>Tus ofertas se cierran y avisamos a tus comerciales.</li>
            <li>Los clientes ya registrados siguen generando comisión si se convierten en venta en los 90 días siguientes; después se cierra la cuenta y se anonimizan los datos personales (los registros de ventas, pagos y facturas se conservan 6 años por obligación legal).</li>
          </ul>
        )}
        <ActionForm action={role === "comercial" ? leaveAsSalesperson : leaveAsCompany} label="Confirmar baja" tone="danger">
          <Checkbox name="confirm" label="Entiendo lo anterior y quiero darme de baja" />
        </ActionForm>
      </div>
    </details>
  );
}
