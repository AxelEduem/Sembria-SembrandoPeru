import { Check, GraduationCap, Users } from "lucide-react";
import { useRehireFormContext } from "@/contexts/RehireFormContext";

export default function RehireTypeSelector() {
  const {
    selectedType,
    handleTypeChange,
    canCreateVoluntario,
    canCreatePracticante,
  } = useRehireFormContext();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-700">
          Tipo de integrante para el nuevo periodo
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          Selecciona una opción
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleTypeChange("voluntario")}
          disabled={!canCreateVoluntario}
          className={`group relative flex min-h-[74px] items-center gap-3 rounded-xl border px-4 text-left transition-all duration-200 ${
            selectedType === "voluntario"
              ? "border-[#2D5A3D]/30 bg-emerald-50/80 shadow-sm shadow-[#2D5A3D]/5"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          } ${!canCreateVoluntario ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              selectedType === "voluntario"
                ? "bg-[#2D5A3D] text-white shadow-sm"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <Users className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Voluntario</p>
            <p className="mt-0.5 text-xs leading-4 text-slate-500">
              Integrante voluntario de la organización
            </p>
          </div>
          {selectedType === "voluntario" && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D5A3D] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange("practicante")}
          disabled={!canCreatePracticante}
          className={`group relative flex min-h-[74px] items-center gap-3 rounded-xl border px-4 text-left transition-all duration-200 ${
            selectedType === "practicante"
              ? "border-amber-300 bg-amber-50/80 shadow-sm shadow-amber-900/5"
              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
          } ${!canCreatePracticante ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${
              selectedType === "practicante"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
            }`}
          >
            <GraduationCap className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Practicante</p>
            <p className="mt-0.5 text-xs leading-4 text-slate-500">
              Estudiante en período de prácticas
            </p>
          </div>
          {selectedType === "practicante" && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}