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
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
      <div className="space-y-6">
        <div>
          <label htmlFor={salesId} className="flex justify-between font-semibold">
            <span>Ventas al mes</span><output htmlFor={salesId} className="tabular-nums">{sales}</output>
          </label>
          <input id={salesId} type="range" min={1} max={10} value={sales} onChange={(e) => setSales(Number(e.target.value))} className="mt-2 h-11 w-full accent-primary" />
        </div>
        <div>
          <label htmlFor={commId} className="block font-semibold">Comisión por venta</label>
          <select id={commId} value={commission} onChange={(e) => setCommission(Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2">
            {[300, 500, 800, 1200].map((n) => <option key={n} value={n}>{eur.format(n)}</option>)}
          </select>
        </div>
      </div>
      <div className="rounded-2xl bg-forest p-6 text-white sm:p-8" aria-live="polite">
        <p className="text-white/80">Con {sales} venta{sales > 1 ? "s" : ""} al mes cobrarías</p>
        <p className="mt-1 text-5xl font-extrabold tabular-nums">{eur.format(month)}<span className="text-xl font-semibold text-white/80"> al mes</span></p>
        <p className="mt-2 text-white/80 tabular-nums">{eur.format(month * 12)} al año, sin descuentos de ComisionaTe.</p>
        <p className="mt-4 text-xs text-white/70">Ejemplo orientativo: la comisión real la fija cada oferta y depende de que el cliente firme y no cancele. Antes de impuestos.</p>
      </div>
    </div>
  );
}
