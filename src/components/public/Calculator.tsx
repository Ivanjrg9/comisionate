"use client";

import { useId, useState } from "react";

const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

export function Calculator() {
  const [sales, setSales] = useState(2);
  const [commission, setCommission] = useState(500);
  const salesId = useId();
  const commId = useId();
  const month = sales * commission;
  return (
    <div className="frame grid lg:grid-cols-2">
      <div className="space-y-6 p-6 sm:p-8">
        <div>
          <label htmlFor={salesId} className="flex justify-between text-sm font-medium">
            <span>Ventas al mes</span><output htmlFor={salesId} className="tabular-nums">{sales}</output>
          </label>
          <input id={salesId} type="range" min={1} max={10} value={sales} onChange={(e) => setSales(Number(e.target.value))} className="mt-2 h-11 w-full accent-primary" />
        </div>
        <div>
          <label htmlFor={commId} className="block text-sm font-medium">Comisión por venta</label>
          <select id={commId} value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-true-black px-3 py-2 transition hover:border-border-strong">
            {[300, 500, 800, 1200].map((n) => <option key={n} value={n}>{eur.format(n)}</option>)}
          </select>
        </div>
      </div>
      <div className="relative border-t border-border bg-true-black p-6 sm:p-8 lg:border-l lg:border-t-0" aria-live="polite">
        <div aria-hidden className="spectrum-line absolute inset-x-0 top-0 opacity-70 lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-px lg:[background:linear-gradient(180deg,#ffb931_15%,#fff_30%,#fff_40%,#2e73fc_50%,transparent)]" />
        <p className="text-sm text-muted">Con {sales} venta{sales > 1 ? "s" : ""} al mes cobrarías</p>
        <p className="mt-2 text-5xl font-medium tracking-tight tabular-nums">{eur.format(month)}<span className="text-lg font-normal text-muted"> al mes</span></p>
        <p className="mt-2 tabular-nums text-muted">{eur.format(month * 12)} al año, sin descuentos de ComisionaTe.</p>
        <p className="mt-4 text-xs text-muted">Ejemplo orientativo: la comisión real la fija cada oferta y depende de que el cliente firme y no cancele. Antes de impuestos.</p>
      </div>
    </div>
  );
}
