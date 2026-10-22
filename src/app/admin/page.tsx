import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Administración" };

export default async function AdminHome() {
  const profile = await getProfile();
  return (
    <>
      <h1 className="text-2xl font-bold">Hola, {profile?.full_name}</h1>
      <p className="mt-2 text-muted">Panel de administración de ComisionaTe.</p>
    </>
  );
}
