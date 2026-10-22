export type CompanyStats = { verified: boolean; founder: boolean; good_payer: boolean; rating: number | null; reviews: number };

export function Rating({ rating, reviews }: { rating: number | null; reviews: number }) {
  if (!reviews || rating == null) return <span className="text-xs text-muted">Sin valoraciones</span>;
  return (
    <span className="text-sm" aria-label={`${rating} de 5 estrellas, ${reviews} valoraciones`}>
      <span aria-hidden style={{ color: "#ca8a04" }}>★</span> <strong>{String(rating).replace(".", ",")}</strong>
      <span className="text-muted"> ({reviews})</span>
    </span>
  );
}

/** Insignias: empresa verificada, empresa fundadora, buen pagador. */
export function Badges({ stats }: { stats: CompanyStats }) {
  const items = [
    stats.verified && ["Empresa verificada", "bg-primary/15 text-on-tint"],
    stats.founder && ["Empresa fundadora", "bg-accent/40"],
    stats.good_payer && ["Buen pagador", "bg-primary/15 text-on-tint"],
  ].filter(Boolean) as [string, string][];
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(([label, tone]) => <li key={label} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</li>)}
    </ul>
  );
}
