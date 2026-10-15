import { X } from "lucide-react";

import PersonAvatar from "./PersonAvatar";

function SelectedPeople({ selectedPeople, lockedIds = [], onRemove, onClear }) {
  if (!selectedPeople.length) {
    return null;
  }

  return (
    <div className="mb-4 animate-[fadeIn_.25s_ease-out]">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-[12px] font-bold tracking-[0.08em] text-slate-500 uppercase">
              Seleccionados
            </p>

            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {selectedPeople.length}
            </span>
          </div>

          <p className="mt-0.5 text-[11px] text-slate-400">Personas incluidas en la comparación</p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
        >
          Limpiar
        </button>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-3">
        <div className="flex max-h-[120px] flex-wrap gap-2.5 overflow-y-auto">
          {selectedPeople.map((person) => (
            <div
              key={person.id}
              className="group flex max-w-full min-w-0 items-center gap-2.5 rounded-lg border border-emerald-100 bg-white py-2 pr-2 pl-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <PersonAvatar person={person} size="tiny" />

              <span className="max-w-[140px] truncate text-[11px] font-bold text-emerald-800">
                {person.nombre}
              </span>

              {lockedIds.includes(String(person.id)) ? (
                <span className="px-1 text-[9px] font-extrabold text-emerald-600">Tú</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onRemove(person.id)}
                  aria-label={`Quitar ${person.nombre}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-400 transition-all duration-150 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectedPeople;
