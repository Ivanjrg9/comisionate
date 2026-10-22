import { RULES } from "@/lib/content/site";

const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={`flex items-baseline gap-2 ${strong ? "text-lg font-extrabold" : ""}`}>
    <dt className="shrink-0">{label}</dt>
    <span aria-hidden className="mb-1 min-w-4 flex-1 border-b-2 border-dotted border-muted/50" />
    <dd className="shrink-0 tabular-nums">{value}</dd>
  </div>
);

/** Recibo de ejemplo: enseña la regla de dinero (comisión íntegra para el comercial + 10 % para ComisionaTe). */
export function Ticket() {
  return (
    <figure className="ticket-print relative mx-auto w-full max-w-sm">
      <div className="rounded-t-lg border-x-2 border-t-2 border-dashed border-border bg-background px-6 pb-6 pt-7">
        <p className="text-sm font-semibold text-muted">Ejemplo de comisión por venta</p>
        <p className="mt-1 text-xl font-bold">Instalación solar en vivienda</p>
        <dl className="mt-5 space-y-2.5">
          <Line label="Venta firmada" value="12.500 €" />
          <Line label="Comisión pactada" value="500 €" />
        </dl>
        <hr className="my-5 border-t-2 border-dashed border-border" />
        <dl className="space-y-2.5">
          <Line label="Cobra el comercial" value="500 €" strong />
          <Line label={`Tarifa ComisionaTe (${RULES.feePercent} %)`} value="50 €" />
          <Line label="Paga la empresa" value="550 €" />
        </dl>
      </div>
      <svg aria-hidden viewBox="0 0 200 12" preserveAspectRatio="none" className="-mt-px block h-3 w-full">
        <path d="M0 0 V2 L10 11 L20 2 L30 11 L40 2 L50 11 L60 2 L70 11 L80 2 L90 11 L100 2 L110 11 L120 2 L130 11 L140 2 L150 11 L160 2 L170 11 L180 2 L190 11 L200 2 V0" fill="var(--background)" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-4 text-center text-sm text-muted">El comercial cobra la comisión íntegra. ComisionaTe nunca le descuenta nada.</figcaption>
    </figure>
  );
}
