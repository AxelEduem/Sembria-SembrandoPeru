import { UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import ComboboxField from "@/components/ui/ComboboxField";
import { inputClass, labelClass, fieldClass } from "@/constants/formConstants";
import { sanitizeName } from "@/utils/formHelpers";
import { DEPARTAMENTOS, getProvincias, getDistritos } from "@/constants/ubicacionesPeru";

export default function IntegranteFormPersonalSection() {
  const {
    nombres,
    setNombres,
    apellidos,
    setApellidos,
    fechaNacimiento,
    setFechaNacimiento,
    tipoDocumento,
    setTipoDocumento,
    documentoIdentidad,
    setDocumentoIdentidad,
    telefono,
    setTelefono,
    modalidad,
    setModalidad,
    departamento,
    setDepartamento,
    ciudad,
    setCiudad,
    distrito,
    setDistrito,
    submitting,
  } = useIntegranteFormContext();

  const busy = submitting;

  const provincias = getProvincias(departamento);
  const distritos = getDistritos(ciudad);

  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <UserRound className="h-5 w-5 text-emerald-600" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Datos personales</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Registra la información personal y de contacto del integrante.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-5 p-6 sm:grid-cols-2">
        {/* Nombres */}
        <div className={fieldClass}>
          <label htmlFor="integrante-nombres" className={labelClass}>
            Nombres
          </label>
          <Input
            id="integrante-nombres"
            value={nombres}
            onChange={(event) => setNombres(sanitizeName(event.target.value))}
            maxLength={120}
            autoComplete="given-name"
            className={`${inputClass} uppercase`}
            placeholder="Ej. ANA MARIA"
            disabled={busy}
          />
        </div>

        {/* Apellidos */}
        <div className={fieldClass}>
          <label htmlFor="integrante-apellidos" className={labelClass}>
            Apellidos
          </label>
          <Input
            id="integrante-apellidos"
            value={apellidos}
            onChange={(event) => setApellidos(sanitizeName(event.target.value))}
            maxLength={120}
            autoComplete="family-name"
            className={`${inputClass} uppercase`}
            placeholder="Ej. TORRES RUIZ"
            disabled={busy}
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className={fieldClass}>
          <label htmlFor="integrante-fecha-nacimiento" className={labelClass}>
            Fecha de nacimiento
          </label>
          <Input
            id="integrante-fecha-nacimiento"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={fechaNacimiento}
            onChange={(event) => setFechaNacimiento(event.target.value)}
            className={inputClass}
            disabled={busy}
          />
        </div>

        {/* Tipo de documento */}
        <div className={fieldClass}>
          <label htmlFor="integrante-tipo-documento" className={labelClass}>
            Tipo de documento
          </label>
          <select
            id="integrante-tipo-documento"
            value={tipoDocumento}
            onChange={(event) => {
              setTipoDocumento(event.target.value);
              setDocumentoIdentidad("");
            }}
            className={`${inputClass} cursor-pointer`}
            disabled={busy}
          >
            <option value="">Selecciona un tipo de documento</option>
            <option value="dni">DNI</option>
            <option value="ruc">RUC</option>
            <option value="carnet de extranjeria">Carnet de Extranjería</option>
          </select>
        </div>

        {/* Documento de identidad */}
        <div className={fieldClass}>
          <label htmlFor="integrante-documento-identidad" className={labelClass}>
            Documento de identidad
          </label>
          <Input
            id="integrante-documento-identidad"
            value={documentoIdentidad}
            onChange={(event) =>
              setDocumentoIdentidad(
                tipoDocumento === "dni" || tipoDocumento === "ruc"
                  ? event.target.value.replace(/\D/g, "")
                  : event.target.value.replace(/[^a-z0-9-]/gi, ""),
              )
            }
            maxLength={tipoDocumento === "dni" ? 8 : tipoDocumento === "ruc" ? 11 : 20}
            className={inputClass}
            disabled={busy || !tipoDocumento}
            placeholder={
              !tipoDocumento
                ? "Selecciona primero el tipo"
                : tipoDocumento === "dni"
                  ? "Ej. 12345678"
                  : tipoDocumento === "ruc"
                    ? "Ej. 20123456789"
                    : "Ej. CE123456"
            }
          />
        </div>

        {/* Teléfono */}
        <div className={fieldClass}>
          <label htmlFor="integrante-telefono" className={labelClass}>
            Teléfono
          </label>
          <Input
            id="integrante-telefono"
            value={telefono}
            onChange={(event) => setTelefono(event.target.value)}
            className={inputClass}
            disabled={busy}
            placeholder="Ingresa un número de teléfono"
            autoComplete="tel"
          />
        </div>

        {/* Modalidad */}
        <div className={fieldClass}>
          <label htmlFor="integrante-modalidad" className={labelClass}>
            Modalidad
          </label>
          <select
            id="integrante-modalidad"
            value={modalidad}
            onChange={(event) => setModalidad(event.target.value)}
            className={`${inputClass} cursor-pointer`}
            disabled={busy}
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
          disabled={busy}
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
          disabled={busy || !departamento}
          required={false}
        />

        <ComboboxField
          label="Distrito"
          value={distrito}
          onChange={setDistrito}
          options={distritos}
          placeholder={!ciudad ? "Primero selecciona una ciudad" : "Selecciona un distrito"}
          disabled={busy || !ciudad}
          required={false}
        />
      </div>
    </section>
  );
}
