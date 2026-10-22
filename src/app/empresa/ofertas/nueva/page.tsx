import type { Metadata } from "next";
import { getSectors } from "@/lib/data";
import { OfferForm } from "../OfferForm";

export const metadata: Metadata = { title: "Nueva oferta" };

export default async function NewOfferPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Nueva oferta</h1>
      <OfferForm sectors={await getSectors()} />
    </div>
  );
}
