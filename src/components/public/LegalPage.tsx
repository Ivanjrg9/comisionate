import { LEGAL } from "@/lib/content/site";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted">Última actualización: {LEGAL.updated}</p>
      {LEGAL.draft && (
        <p role="note" className="mt-4 max-w-3xl rounded-lg border border-accent border border-border-strong bg-surface p-3 text-sm">
          <strong>Plantilla pendiente de revisión.</strong> Este texto es un borrador y debe revisarlo un profesional jurídico antes de publicarse; los datos entre corchetes están por completar.
        </p>
      )}
      <div className="legal mt-6">{children}</div>
    </main>
  );
}
