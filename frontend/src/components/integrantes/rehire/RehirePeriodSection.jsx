import { Input } from "@/components/ui/input";
import { useRehireFormContext } from "@/contexts/RehireFormContext";
import { inputClass, labelClass, fieldClass } from "./RehireField";
import { QUICK_PERIODS } from "@/constants/formConstants";

export default function RehirePeriodSection() {
  const {
    areaId,
    updateArea,
    allowedAreas,
    cargoId,
    setCargoId,
    availableCargos,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    minFechaFin,
    periodMonths,
    activeQuickPeriod,
    applyQuickPeriod,
    saving,
    isAreaScoped,
  } = useRehireFormContext();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">Nuevo periodo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Selecciona el área, cargo y nuevas fechas de contratación.
        </p>
      </div>
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div className={fieldClass}>
          <label htmlFor="rehire-area" className={labelClass}>
            Área
          </label>
          <select
            id="rehire-area"
            value={areaId}
            onChange={(event) => updateArea(event.target.value)}
            className={`${inputClass} cursor-pointer`}
            disabled={saving || isAreaScoped}
          >
            <option value="">Selecciona un área</option>
            {allowedAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="rehire-cargo" className={labelClass}>
            Cargo
          </label>
          <select
            id="rehire-cargo"
            value={cargoId}
            onChange={(event) => setCargoId(event.target.value)}
            className={`${inputClass} cursor-pointer`}
            disabled={saving || !areaId}
          >
            <option value="">Selecciona un cargo</option>
            {availableCargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldClass}>
          <label htmlFor="rehire-fecha-inicio" className={labelClass}>
            Fecha de inicio
          </label>
          <Input
            id="rehire-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="rehire-fecha-fin" className={labelClass}>
            Fecha de fin
          </label>
          <Input
            id="rehire-fecha-fin"
            type="date"
            min={minFechaFin || undefined}
            value={fechaFin}
            onChange={(event) => setFechaFin(event.target.value)}
            className={inputClass}
            disabled={saving}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Duración</span>
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {periodMonths || "-"} {periodMonths === 1 ? "mes" : "meses"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {QUICK_PERIODS.map((months) => {
              const selected = activeQuickPeriod === months;
              return (
                <button
                  key={months}
                  type="button"
                  disabled={!fechaInicio || saving}
                  onClick={() => applyQuickPeriod(months)}
                  className={`h-12 rounded-xl border text-sm font-semibold transition-all ${
                    selected
                      ? "border-[#2D5A3D] bg-[#2D5A3D] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/70 hover:text-emerald-700"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {months} {months === 1 ? "mes" : "meses"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}