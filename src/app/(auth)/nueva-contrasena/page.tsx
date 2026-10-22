import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function NewPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=enlace");
  return (
    <>
      <h1 className="mb-5 text-2xl font-bold">Elige tu contraseña nueva</h1>
      <NewPasswordForm />
    </>
  );
}
