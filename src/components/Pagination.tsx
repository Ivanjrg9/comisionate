import Link from "next/link";
import { PAGE_SIZE } from "@/lib/pagination";

type Params = Record<string, string | undefined>;

const href = (basePath: string, params: Params, page: number) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, pagina: page > 1 ? String(page) : undefined })) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
};

/** Paginación anterior/siguiente que conserva el resto de filtros de la URL. */
export function Pagination({ page, total, basePath, params = {} }: { page: number; total: number; basePath: string; params?: Params }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const link = "inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold hover:bg-surface";
  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? <Link href={href(basePath, params, page - 1)} rel="prev" className={link}>Anterior</Link> : <span />}
      <p className="text-sm text-muted">Página {page} de {pages} · {total} resultados</p>
      {page < pages ? <Link href={href(basePath, params, page + 1)} rel="next" className={link}>Siguiente</Link> : <span />}
    </nav>
  );
}
