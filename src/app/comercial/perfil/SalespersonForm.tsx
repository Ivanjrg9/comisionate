"use client";

import { saveSalespersonProfile } from "../actions";
import { Checkbox, Field, FormMessage, Select, TextArea, buttonClass } from "@/components/form";
import { useServerForm } from "@/components/useServerForm";

export type SalespersonValues = {
  full_name: string; phone: string; nif: string; fiscal: "autonomo" | "particular"; new_autonomo: boolean;
  zone: string; experience: string; iban: string; sectorIds: number[];
};

export function SalespersonForm({ values, sectors }: { values: SalespersonValues; sectors: { id: number; name: string }[] }) {
  const { state, onSubmit, pending } = useServerForm(saveSalespersonProfile);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Nombre y apellidos" name="full_name" defaultValue={values.full_name} required error={e.full_name} />
      <Field label="Teléfono" name="phone" type="tel" defaultValue={values.phone} error={e.phone} />
      <Field label="DNI / NIE" name="nif" defaultValue={values.nif} required error={e.nif} />
      <Select label="Situación fiscal" name="fiscal" defaultValue={values.fiscal}>
        <option value="particular">Particular (sin alta de autónomo)</option>
        <option value="autonomo">Autónomo</option>
      </Select>
      <Checkbox label="Soy nuevo autónomo" hint="Solo si eres autónomo: usamos un 7 % de IRPF en vez del 15 % en el desglose orientativo." name="new_autonomo" defaultChecked={values.new_autonomo} />
      <Field label="Zona donde trabajas" name="zone" defaultValue={values.zone} error={e.zone} />
      <TextArea label="Experiencia" name="experience" defaultValue={values.experience} error={e.experience} />
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Sectores</legend>
        {sectors.map((s) => (
          <Checkbox key={s.id} label={s.name} name="sectors" value={s.id} defaultChecked={values.sectorIds.includes(s.id)} />
        ))}
      </fieldset>
      <Field label="IBAN (para cobrar)" name="iban" defaultValue={values.iban} hint="Solo lo ven las empresas con las que tengas comisiones pendientes de pago." error={e.iban} autoComplete="off" />
      <Field label="Foto" name="photo" type="file" accept="image/png,image/jpeg,image/webp" hint="PNG, JPG o WebP, máximo 5 MB" error={e.photo} />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Guardando…" : "Guardar perfil"}</button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
