/* eslint-disable @next/next/no-img-element -- las URLs vienen de Supabase Storage (dominio variable) */
export function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  return src ? (
    <img src={src} alt={`Logo de ${name}`} width={size} height={size} className="rounded-lg border border-border object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-lg bg-primary/15 font-bold text-on-tint"
      style={{ width: size, height: size }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
