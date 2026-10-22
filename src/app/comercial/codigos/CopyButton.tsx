"use client";

import { useState } from "react";
import { secondaryButtonClass } from "@/components/form";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copia tu código:", text);
    }
  }
  return (
    <button type="button" onClick={copy} className={`${secondaryButtonClass} !min-h-10`} aria-live="polite">
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}
