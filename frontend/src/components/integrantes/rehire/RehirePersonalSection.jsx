import { useRehireFormContext } from "@/contexts/RehireFormContext";
import { RehireField, inputClass, labelClass, fieldClass } from "./RehireField";
import RehireTypeSelector from "./RehireTypeSelector";
import ComboboxField from "@/components/ui/ComboboxField";
import {
  DEPARTAMENTOS,
  getProvincias,
  getDistritos,
} from "@/constants/ubicacionesPeru";

export default function RehirePersonalSection() {
  const {
    row,
    modalidad,
    setModalidad,
    saving,
    departamento,
    setDepartamento,
    ciudad,
    setCiudad,
    distrito,
    setDistrito,
  } = useRehireFormContext();

  const provincias = getProvincias(departamento);
  const distritos = getDistritos(ciudad);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-base font-semibold text-slate-900">Datos del integrante</h2>
        <p className="mt-1 text-sm text-slate-500">
          Los datos personales se conservan del registro anterior.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <RehireTypeSelector />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <RehireField label="Nombres" value={row?.nombres} />
          <RehireField label="Apellidos" value={row?.apellidos} />
          <RehireField label="Documento" value={row?.documento_identidad} />
          <RehireField label="Teléfono" value={row?.telefono} />
          <RehireField label="Correo institucional" value={row?.correo} />

          <div className={fieldClass}>
            <label htmlFor="rehire-modalidad" className={labelClass}>
              Modalidad
            </label>
            <select
              id="rehire-modalidad"
              value={modalidad}
              onChange={(event) => setModalidad(event.target.value)}
              className={`${inputClass} cursor-pointer`}
              disabled={saving}
            >
              <option value="">Selecciona una modalidad</option>
              <option value="presencial">Presencial</option>
              <option value="remoto">Remoto</option>
              <option value="híbrido">Híbrido</option>
            </select>
          </div>

          {/* ========== UBICACIÓN (con ComboboxField) ========== */}
          <ComboboxField
            label="Departamento"
            value={departamento}
            onChange={(value) => {
              setDepartamento(value);
              setCiudad("");
              setDistrito("");
            }}
            options={DEPARTAMENTOS}
            placeholder="Selecciona un departamento"
            disabled={saving}
            required={false}
          />

          <ComboboxField
            label="Ciudad / Provincia"
            value={ciudad}
            onChange={(value) => {
              setCiudad(value);
              setDistrito("");
            }}
            options={provincias}
            placeholder={
              !departamento
                ? "Primero selecciona un departamento"
                : "Selecciona una ciudad / provincia"
            }
            disabled={saving || !departamento}
            required={false}
          />

          <ComboboxField
            label="Distrito"
            value={distrito}
            onChange={setDistrito}
            options={distritos}
            placeholder={
              !ciudad
                ? "Primero selecciona una ciudad"
                : "Selecciona un distrito"
            }
            disabled={saving || !ciudad}
            required={false}
          />
        </div>
      </div>
    </section>
  );
}