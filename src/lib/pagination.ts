export const PAGE_SIZE = 20;

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Lee `?pagina=` y `?q=` de la URL y calcula el rango de filas (para `.range(from, to)`). */
export function pageParams(sp: SearchParams) {
  const page = Math.max(1, Math.floor(Number(first(sp.pagina))) || 1);
  // Solo letras, números y signos básicos: evita romper los filtros `or()` de PostgREST.
  const q = first(sp.q).replace(/[^\p{L}\p{N}\s+.@_-]/gu, "").trim().slice(0, 60);
  const from = (page - 1) * PAGE_SIZE;
  return { page, q, from, to: from + PAGE_SIZE - 1 };
}

/** Filtro `or()` de PostgREST: el término buscado en varias columnas. */
export const ilikeAny = (columns: string[], q: string) => columns.map((c) => `${c}.ilike.%${q}%`).join(",");
