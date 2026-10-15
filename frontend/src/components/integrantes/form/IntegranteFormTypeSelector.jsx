import { BriefcaseBusiness, Check, GraduationCap, Users } from "lucide-react";

import { useIntegranteFormContext } from "@/contexts/IntegranteFormContext";
import { labelClass } from "@/constants/formConstants";

export default function IntegranteFormTypeSelector() {
  const { mode, selectedType, handleTypeChange, canCreateVoluntario, canCreatePracticante } =
    useIntegranteFormContext();

  if (mode !== "create") return null;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <label className={labelClass}>Tipo de integrante</label>

          <span className="text-xs font-medium text-slate-400">Selecciona una opción</span>
        </div>

        <p className="text-xs leading-5 text-slate-400">
          El tipo seleccionado determinará la información adicional que deberás completar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() => handleTypeChange("voluntario")}
          disabled={!canCreateVoluntario}
          className={`group relative flex min-h-[88px] items-center gap-4 rounded-xl border px-5 text-left transition-all duration-200 ${
            selectedType === "voluntario"
              ? "border-[#2D5A3D]/30 bg-emerald-50/70 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          } ${!canCreateVoluntario ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
              selectedType === "voluntario"
                ? "bg-[#2D5A3D] text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <Users className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Voluntario</p>

            <p className="mt-1 text-xs leading-4 text-slate-500">
              Integrante voluntario de la organización.
            </p>
          </div>

          {selectedType === "voluntario" && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("gerente")}
          disabled={!canCreateVoluntario}
          className={`group relative flex min-h-[88px] items-center gap-4 rounded-xl border px-5 text-left transition-all duration-200 ${
            selectedType === "gerente"
              ? "border-blue-300 bg-blue-50/70 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          } ${!canCreateVoluntario ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
              selectedType === "gerente"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <BriefcaseBusiness className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Gerente</p>
            <p className="mt-1 text-xs leading-4 text-slate-500">
              Perfil de gestión con disponibilidad durante toda la jornada.
            </p>
          </div>

          {selectedType === "gerente" && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("practicante")}
          disabled={!canCreatePracticante}
          className={`group relative flex min-h-[88px] items-center gap-4 rounded-xl border px-5 text-left transition-all duration-200 ${
            selectedType === "practicante"
              ? "border-amber-300 bg-amber-50/70 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          } ${!canCreatePracticante ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all ${
              selectedType === "practicante"
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <GraduationCap className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Practicante</p>

            <p className="mt-1 text-xs leading-4 text-slate-500">
              Estudiante en periodo de prácticas.
            </p>
          </div>

          {selectedType === "practicante" && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
