import { GraduationCap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import ComboboxField from "@/components/ui/ComboboxField";
import {
  CARRERAS_OPCIONES,
  UNIVERSIDADES_OPCIONES,
  CICLOS_OPCIONES,
  inputClass,
  labelClass,
  fieldClass,
} from "@/constants/formConstants";

export default function IntegranteFormPracticeFields() {
  const {
    isPracticante,
    institucionEducativa,
    setInstitucionEducativa,
    horasPracticas,
    setHorasPracticas,
    carrera,
    setCarrera,
    ciclo,
    setCiclo,
    submitting,
  } = useIntegranteFormContext();

  if (!isPracticante) return null;

  const busy = submitting;

  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
            <GraduationCap className="h-5 w-5 text-amber-600" strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">Datos de prácticas</h2>

            <p className="mt-1 text-sm leading-5 text-slate-500">
              Completa la información académica y los requisitos del periodo de prácticas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
        <ComboboxField
          label="Carrera"
          value={carrera}
          onChange={setCarrera}
          options={CARRERAS_OPCIONES}
          placeholder="Selecciona o escribe una carrera"
          disabled={busy}
          required
        />

        <ComboboxField
          label="Ciclo"
          value={ciclo}
          onChange={setCiclo}
          options={CICLOS_OPCIONES}
          placeholder="Selecciona o escribe un ciclo"
          disabled={busy}
          required
        />

        <ComboboxField
          label="Institución educativa"
          value={institucionEducativa}
          onChange={setInstitucionEducativa}
          options={UNIVERSIDADES_OPCIONES}
          placeholder="Selecciona o escribe una institución"
          disabled={busy}
          required
        />

        <div className={fieldClass}>
          <label htmlFor="integrante-horas-practicas" className={labelClass}>
            Horas prácticas requeridas
            <span className="ml-1 text-red-500">*</span>
          </label>

          <Input
            id="integrante-horas-practicas"
            type="number"
            min="1"
            step="1"
            value={horasPracticas}
            onChange={(event) => setHorasPracticas(event.target.value)}
            onWheel={(event) => event.currentTarget.blur()}
            className={inputClass}
            disabled={busy}
            placeholder="Ej. 320"
          />
        </div>
      </div>
    </section>
  );
}
