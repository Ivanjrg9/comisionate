import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Panel de comercial" };

export default async function ComercialHome() {
  const profile = await getProfile();
  return (
    <>
      <h1 className="text-2xl font-bold">Hola, {profile?.full_name}</h1>
      <p className="mt-2 text-muted">Aquí verás las ofertas, tus códigos y tus ganancias.</p>
    </>
  );
}
