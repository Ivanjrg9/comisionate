/** Búsqueda por texto (GET). `keep` conserva otros filtros de la URL, como el estado. */
export function SearchBox({ q, placeholder, keep = {} }: { q: string; placeholder: string; keep?: Record<string, string | undefined> }) {
  return (
    <form role="search" className="mb-4 flex gap-2">
      {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <label className="sr-only" htmlFor="buscar">Buscar</label>
      <input id="buscar" name="q" defaultValue={q} placeholder={placeholder} maxLength={60} className="min-h-11 flex-1 rounded-lg border border-border bg-background px-3 py-2" />
      <button className="min-h-11 rounded-lg border border-border px-5 font-semibold hover:bg-surface">Buscar</button>
    </form>
  );
}
