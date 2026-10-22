import type { Metadata } from "next";
import { getMyCompany, getSectors } from "@/lib/data";
import { CompanyForm } from "./CompanyForm";

export const metadata: Metadata = { title: "Perfil de empresa" };

export default async function CompanyProfilePage() {
  const [company, sectors] = await Promise.all([getMyCompany(), getSectors()]);
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Perfil de empresa</h1>
      <CompanyForm company={company} sectors={sectors} />
    </div>
  );
}
