import type { ComponentProps } from "react";

export const buttonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-5 py-2.5 font-semibold transition hover:bg-surface";

export function Field({
  label,
  error,
  hint,
  ...input
}: { label: string; error?: string; hint?: string } & ComponentProps<"input">) {
  const id = input.id ?? input.name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2"
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

const controlClass = "block min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2";

export function TextArea({ label, error, ...props }: { label: string; error?: string } & ComponentProps<"textarea">) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <textarea id={id} rows={4} aria-invalid={error ? true : undefined} className={controlClass} {...props} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, ...props }: { label: string; error?: string } & ComponentProps<"select">) {
  const id = props.id ?? props.name;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <select id={id} aria-invalid={error ? true : undefined} className={controlClass} {...props}>{children}</select>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function Checkbox({ label, hint, ...props }: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <label className="flex items-start gap-3 py-1">
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" {...props} />
      <span>
        {label}
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function FormMessage({ state }: { state: { error?: string; ok?: boolean } }) {
  if (state.error) return <p role="alert" className="text-sm text-danger">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-primary">Cambios guardados ✓</p>;
  return null;
}
