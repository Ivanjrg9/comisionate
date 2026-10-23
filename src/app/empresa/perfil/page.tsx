import type { Metadata } from "next";
import { getMyCompany, getSectors } from "@/lib/data";
import { CompanyForm } from "./CompanyForm";
import { LeaveAccount } from "@/components/LeaveAccount";
import { dateEs } from "@/lib/format";

export const metadata: Metadata = { title: "Perfil de empresa" };

export default async function CompanyProfilePage() {
  const [company, sectors] = await Promise.all([getMyCompany(), getSectors()]);
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold">Perfil de empresa</h1>
      {company.baja_requested_at && (
        <p role="status" className="mb-6 rounded-xl border border-border-strong bg-surface p-3 text-sm">
          Baja solicitada el {dateEs(company.baja_requested_at)}. Tus ofertas están cerradas. Los clientes ya registrados siguen generando comisión durante 90 días; después cerraremos la cuenta si todo está pagado.
        </p>
      )}
      <CompanyForm company={company} sectors={sectors} />
      {!company.baja_requested_at && <div className="mt-10"><LeaveAccount role="empresa" /></div>}
    </div>
  );
}
