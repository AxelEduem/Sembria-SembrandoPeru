import { Check, Search } from "lucide-react";

import PersonAvatar from "./PersonAvatar";

function PeopleList({
  filteredPeople,
  search,
  onSearchChange,
  loading = false,
  selectedIds,
  lockedIds = [],
  onToggle,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* BUSCADOR */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400"
          strokeWidth={1.8}
        />

        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-4 pl-11 text-sm font-medium text-slate-700 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
        />
      </div>

      {/* CABECERA */}
      <div className="mt-5 mb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <p className="text-[12px] font-bold tracking-[0.08em] text-slate-500 uppercase">
              Personas
            </p>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {filteredPeople.length}
            </span>
          </div>

          <p className="mt-0.5 text-[11px] text-slate-400">Selecciona para comparar</p>
        </div>
      </div>

      {/* LISTA */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-2">
          {!loading &&
            filteredPeople.map((person, index) => {
              const selected = selectedIds.includes(String(person.id));
              const locked = lockedIds.includes(String(person.id));

              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onToggle(person)}
                  aria-pressed={selected}
                  title={locked ? "Tu horario se incluye automáticamente" : undefined}
                  style={{
                    animationDelay: `${index * 25}ms`,
                  }}
                  className={`group flex w-full animate-[slideIn_.3s_ease-out_both] items-center gap-4 rounded-xl border px-3 py-3 text-left transition-all duration-200 ${
                    selected
                      ? "border-emerald-200 bg-emerald-50/70 shadow-[0_3px_10px_rgba(16,185,129,0.08)]"
                      : "border-transparent bg-white hover:-translate-y-0.5 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm"
                  }`}
                >
                  <PersonAvatar person={person} size="small" expandable={false} />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-bold transition-colors ${
                        selected ? "text-emerald-800" : "text-slate-700"
                      }`}
                    >
                      {person.nombre}
                      {locked && (
                        <span className="ml-1 text-[9px] font-extrabold text-emerald-600">
                          (Tú)
                        </span>
                      )}
                    </p>

                    <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                      <span className="font-semibold text-slate-500">Área:</span>{" "}
                      {person.area || "Sin área"}
                    </p>
                    <p className="truncate text-[11px] font-medium text-slate-400">
                      <span className="font-semibold text-slate-500">Cargo:</span>{" "}
                      {person.cargo || "Sin cargo"}
                    </p>
                  </div>

                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                      selected
                        ? "scale-100 border-emerald-500 bg-emerald-500 text-white shadow-[0_2px_6px_rgba(16,185,129,0.25)]"
                        : "border-slate-200 bg-white text-transparent group-hover:border-slate-300"
                    }`}
                  >
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  </div>
                </button>
              );
            })}
        </div>

        {loading && search.trim() && (
          <div className="mt-2 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center">
            <p className="text-sm font-bold text-slate-500">Buscando personas...</p>
          </div>
        )}

        {!loading && !filteredPeople.length && (
          <div className="mt-2 flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
              <Search className="h-6 w-6" strokeWidth={1.7} />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-600">
              {search.trim() ? "No encontramos personas" : "Busca una persona"}
            </p>

            <p className="mt-1 max-w-[220px] text-[11px] leading-5 text-slate-400">
              {search.trim()
                ? "Prueba con otro nombre o correo."
                : "Escribe un nombre o correo para mostrar resultados."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PeopleList;
