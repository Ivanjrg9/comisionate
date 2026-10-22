"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import type { FormState } from "@/lib/validation/auth";

/**
 * Como useActionState, pero sin que React vacíe el formulario cuando la acción devuelve errores
 * (con `<form action>` se resetean todos los campos y el usuario pierde lo escrito).
 */
export function useServerForm(action: (prev: FormState, formData: FormData) => Promise<FormState>) {
  const [state, run, pending] = useActionState(action, {} as FormState);
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Con varios botones de envío, `submitter` incluye el name/value del pulsado.
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => run(formData));
  }
  return { state, onSubmit, pending };
}
