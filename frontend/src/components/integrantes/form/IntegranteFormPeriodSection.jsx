import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import { QUICK_PERIODS, inputClass, labelClass, fieldClass } from "@/constants/formConstants";
import { addMonthsToDate } from "@/utils/formHelpers";

export default function IntegranteFormPeriodSection() {
  const {
    fechaInicio,
    updateFechaInicio,
    fechaFin,
    updateFechaFin,
    activeQuickPeriod,
    applyQuickPeriod,
    submitting,
    isGerente,
  } = useIntegranteFormContext();

  const busy = submitting;

  if (isGerente) {
    return (
      <div className={fieldClass}>
        <label htmlFor="integrante-fecha-inicio" className={labelClass}>
          Fecha de inicio
        </label>

        <Input
          id="integrante-fecha-inicio"
          type="date"
          value={fechaInicio}
          onChange={(event) => updateFechaInicio(event.target.value)}
          className={inputClass}
          disabled={busy}
        />

        <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
          El gerente permanece activo hasta que se le desactive manualmente.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="integrante-fecha-inicio" className={labelClass}>
            Fecha de inicio
          </label>

          <Input
            id="integrante-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(event) => updateFechaInicio(event.target.value)}
            className={inputClass}
            disabled={busy}
          />
        </div>

        <div className={fieldClass}>
          <label htmlFor="integrante-fecha-fin" className={labelClass}>
            Fecha de fin
          </label>

          <Input
            id="integrante-fecha-fin"
            type="date"
            min={fechaInicio ? addMonthsToDate(fechaInicio, 1) : undefined}
            value={fechaFin}
            onChange={(event) => updateFechaFin(event.target.value)}
            className={inputClass}
            disabled={busy}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:p-5">
        <div className="mb-4">
          <p className={labelClass}>Acciones rápidas</p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Selecciona una duración para calcular automáticamente la fecha de fin.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {QUICK_PERIODS.map((months) => {
            const isSelected = activeQuickPeriod === months;

            return (
              <button
                key={months}
                type="button"
                disabled={!fechaInicio || busy}
                onClick={() => applyQuickPeriod(months)}
                className={`group relative flex h-12 items-center justify-center gap-1.5 rounded-xl border px-3 transition-all duration-200 ${
                  isSelected
                    ? "border-[#2D5A3D] bg-[#2D5A3D] text-white shadow-sm"
                    : "border-slate-200 bg-white font-semibold text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                } ${!fechaInicio || busy ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/15">
                    <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </span>
                )}

                <span
                  className={`text-base font-bold ${
                    isSelected ? "text-white" : "text-slate-800 group-hover:text-emerald-700"
                  }`}
                >
                  {months}
                </span>

                <span
                  className={`text-xs font-medium ${
                    isSelected ? "text-white/90" : "text-slate-500 group-hover:text-emerald-700"
                  }`}
                >
                  {months === 1 ? "mes" : "meses"}
                </span>
              </button>
            );
          })}
        </div>

        {!fechaInicio && (
          <p className="mt-3 text-[11px] text-slate-400">
            Selecciona primero la fecha de inicio para usar las acciones rápidas.
          </p>
        )}
      </div>
    </>
  );
}