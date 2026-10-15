import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import { inputClass, labelClass, fieldClass } from "@/constants/formConstants";

export default function IntegranteFormAreaSection() {
  const {
    areaId,
    updateArea,
    isAreaScoped,
    allowedAreas,
    userAreaId,
    cargos,
    cargoId,
    setCargoId,
    setAreaId,
    setFormError,
    submitting,
    canManageCurrentType,
    availableCargos,
  } = useIntegranteFormContext();

  const busy = submitting;

  return (
    <>
      <div className={fieldClass}>
        <label htmlFor="integrante-area" className={labelClass}>
          Área
        </label>

        {isAreaScoped ? (
          <div className="flex h-11 w-full items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm font-medium text-slate-700">
            {allowedAreas.find((area) => Number(area.id) === Number(userAreaId))?.nombre ||
              "Sin área configurada"}
          </div>
        ) : (
          <select
            id="integrante-area"
            value={areaId}
            onChange={(event) => updateArea(event.target.value)}
            disabled={busy || !canManageCurrentType}
            className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <option value="">
              {allowedAreas.length === 0 ? "No hay áreas disponibles" : "Selecciona un área"}
            </option>

            {allowedAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={fieldClass}>
        <label htmlFor="integrante-cargo" className={labelClass}>
          Cargo
        </label>

        <select
          id="integrante-cargo"
          value={cargoId}
          onChange={(event) => {
            const nextCargoId = event.target.value;

            setCargoId(nextCargoId);

            const selected = cargos.find((cargo) => String(cargo.id) === String(nextCargoId));

            if (selected?.area_id) {
              setAreaId(String(selected.area_id));
            }

            setFormError("");
          }}
          disabled={!areaId || busy || !canManageCurrentType}
          className={`${inputClass} cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <option value="">
            {!areaId
              ? "Selecciona un área primero"
              : availableCargos.length === 0
                ? "No hay cargos disponibles"
                : "Selecciona un cargo"}
          </option>

          {availableCargos.map((cargo) => (
            <option key={cargo.id} value={cargo.id}>
              {cargo.nombre}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
