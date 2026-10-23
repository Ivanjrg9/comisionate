"use client";

import { useId, useState, type KeyboardEvent } from "react";

const Dot = ({ tone }: { tone: string }) => <span aria-hidden className={`size-2 rounded-full ${tone}`} />;
const Chip = ({ tone, children }: { tone: string; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium"><Dot tone={tone} />{children}</span>
);
const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-xs text-muted">{label}</p>
    <p className="rounded-xl border border-border bg-true-black px-3 py-2 text-sm">{value}</p>
  </div>
);

const TABS = [
  {
    id: "registrar",
    label: "Registrar cliente",
    title: "Registrar un cliente en menos de un minuto",
    body: (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Oferta y código" value="Instalación solar residencial · SOLAR-IVAN-7K2" /></div>
        <Field label="Nombre del cliente" value="Ana Torres" />
        <Field label="Teléfono" value="600 11 10 01" />
        <p className="flex items-center gap-2 text-sm text-muted sm:col-span-2"><span aria-hidden className="inline-flex size-4 items-center justify-center rounded border border-border-strong text-[10px] text-foreground">✓</span>El cliente ha dado su consentimiento para compartir sus datos con la empresa</p>
        <p className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/10 bg-primary px-4 text-sm font-medium text-primary-foreground sm:col-span-2 sm:w-fit">Registrar cliente</p>
      </div>
    ),
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    title: "Cada cliente, en su punto del proceso",
    body: (
      <ul className="divide-y divide-border text-sm">
        {[
          ["Ana Torres", "bg-ash", "Registrado"],
          ["Luis Pardo", "bg-amber", "Lead cualificado"],
          ["Rosa Gil", "bg-amber", "En periodo de cancelación"],
          ["Hugo León", "bg-success", "Venta confirmada"],
        ].map(([name, tone, status]) => (
          <li key={name} className="flex flex-wrap items-center justify-between gap-2 py-3"><span>{name}</span><Chip tone={tone}>{status}</Chip></li>
        ))}
      </ul>
    ),
  },
  {
    id: "cobro",
    label: "Cobro",
    title: "Tu comisión, íntegra y con fecha",
    body: (
      <div className="space-y-3 text-sm">
        {[
          ["Comisión por venta", "500 €", "bg-success", "Pagada por la empresa"],
          ["Comisión por lead", "50 €", "bg-success", "Cobrada"],
        ].map(([t, amount, tone, status]) => (
          <div key={t} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <div><p className="font-medium">{t}</p><p className="text-xs text-muted">Hugo León · Instalación solar residencial</p></div>
            <div className="flex items-center gap-3"><Chip tone={tone}>{status}</Chip><span className="text-lg font-semibold tabular-nums">{amount}</span></div>
          </div>
        ))}
        <p className="text-xs text-muted">El IBAN solo lo ve la empresa con comisiones pendientes con ese comercial.</p>
      </div>
    ),
  },
] as const;

/** Marco de producto con pestañas: la propia interfaz es la prueba. */
export function ProductPreview() {
  const [active, setActive] = useState(0);
  const uid = useId();

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setActive(next);
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }

  return (
    <div className="frame">
      <div className="relative min-h-[320px] p-4 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent" />
        <p className="relative mb-4 text-xs text-muted">Panel del comercial · datos de ejemplo</p>
        {TABS.map((t, i) => (
          <div key={t.id} role="tabpanel" id={`${uid}-panel-${i}`} aria-labelledby={`${uid}-tab-${i}`} hidden={active !== i} className="relative">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">{t.title}</h3>
            {t.body}
          </div>
        ))}
      </div>
      <div role="tablist" aria-label="Qué puedes hacer en el panel" className="flex flex-wrap gap-2 border-t border-border bg-true-black p-3">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            role="tab"
            id={`${uid}-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`${uid}-panel-${i}`}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={onKeyDown}
            className="min-h-9 rounded border border-border px-3 text-sm font-medium text-muted transition hover:text-foreground aria-selected:border-border-strong aria-selected:bg-surface aria-selected:text-foreground"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
