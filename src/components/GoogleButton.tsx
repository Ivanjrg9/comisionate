"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** «Continuar con Google». Solo se muestra si NEXT_PUBLIC_GOOGLE_ENABLED=true (requiere configurar Google en Supabase). */
export function GoogleButton({ label = "Continuar con Google" }: { label?: string }) {
  const [error, setError] = useState<string | null>(null);
  if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "true") return null;

  async function signIn() {
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={signIn} className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-5 py-2.5 font-semibold transition hover:bg-surface">
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1Z" />
          <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 0 1 0-4.300V7.100H2.400a11 11 0 0 0 0 9.900L6 14.200Z" />
          <path fill="#EA4335" d="M12 5.400c1.600 0 3 .6 4.200 1.600l3.100-3.100A11 11 0 0 0 2.400 7.100L6 9.900c.8-2.600 3.200-4.500 6-4.500Z" />
        </svg>
        {label}
      </button>
      <p className="text-xs text-muted">Al continuar aceptas los términos de uso y la política de privacidad.</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}

export function OrDivider() {
  if (process.env.NEXT_PUBLIC_GOOGLE_ENABLED !== "true") return null;
  return (
    <div className="my-5 flex items-center gap-3 text-sm text-muted" aria-hidden>
      <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
    </div>
  );
}
