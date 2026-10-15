import { CalendarCheck2, Clock3, LayoutGrid, Timeline, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import PeopleList from "./PeopleList";
import SelectedPeople from "./SelectedPeople";
import WeeklyTimeline from "./WeeklyTimeline";
import AvailabilityCards from "./AvailabilityCards";

import { calculateCommonAvailability, getTotalDurationLabel } from "./disponibilidadUtils";

function DisponibilidadIntegrantes({
  rows = [],
  initialSelectedIds = [],
  lockedIds = [],
  loadingPeople = false,
  onSearchPeople,
  onCreateMeeting,
}) {
  const normalizedLockedIds = useMemo(() => lockedIds.map(String), [lockedIds]);
  const [selectedIds, setSelectedIds] = useState(() => initialSelectedIds.map(String));
  const [search, setSearch] = useState("");
  const [displayMode, setDisplayMode] = useState("timeline");

  const people = useMemo(
    () =>
      [...rows]
        .filter((row) => row?.id)
        .sort((first, second) =>
          String(first.nombre || "").localeCompare(String(second.nombre || ""), "es"),
        ),
    [rows],
  );

  const filteredPeople = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("es-PE");
    if (!normalized) return [];
    return people.filter((person) =>
      `${person.nombre || ""} ${person.correo || ""} ${person.area || ""} ${person.cargo || ""}`
        .toLocaleLowerCase("es-PE")
        .includes(normalized),
    );
  }, [people, search]);

  const handleSearchChange = (value) => {
    setSearch(value);
    onSearchPeople?.(value);
  };

  const selectedPeople = useMemo(
    () =>
      selectedIds
        .map((id) => people.find((person) => String(person.id) === String(id)))
        .filter(Boolean),
    [people, selectedIds],
  );

  const availability = useMemo(() => calculateCommonAvailability(selectedPeople), [selectedPeople]);
  const totalAvailableMinutes = useMemo(
    () => availability.reduce((total, item) => total + Math.max(0, item.end - item.start), 0),
    [availability],
  );
  const updateSelectedIds = (updater) => {
    setSelectedIds(updater);
  };

  const createMeetingFromAvailability = (item) => {
    onCreateMeeting?.({ availability: item, people: selectedPeople });
  };

  const togglePerson = (person) => {
    const id = String(person.id);
    if (normalizedLockedIds.includes(id)) return;
    updateSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const removePerson = (personId) => {
    if (normalizedLockedIds.includes(String(personId))) return;
    updateSelectedIds((current) => current.filter((id) => String(id) !== String(personId)));
  };

  const clearSelection = () => {
    updateSelectedIds(normalizedLockedIds);
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: scale(1); } }
          @keyframes blockIn { from { opacity: 0; transform: translateY(-50%) scaleX(.96); } to { opacity: 1; transform: translateY(-50%) scaleX(1); } }
        `}
      </style>

      <div className="space-y-5">
        {/* HEADER */}
        <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <UsersRound className="h-6 w-6" strokeWidth={1.8} />
                {selectedPeople.length >= 2 && (
                  <span className="absolute -right-1 -bottom-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-[-0.015em] text-slate-800">
                    Disponibilidad de personas
                  </h2>
                  {selectedPeople.length >= 2 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                      Comparando
                    </span>
                  )}
                </div>
                <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">
                  Selecciona personas para encontrar automáticamente los momentos en los que todos
                  están disponibles.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                  <UsersRound className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[8px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                    Seleccionados
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-700">
                    {selectedPeople.length}
                  </p>
                </div>
              </div>
              {selectedPeople.length >= 2 && (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                    <CalendarCheck2 className="h-4 w-4" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold tracking-[0.08em] text-emerald-500 uppercase">
                      Coincidencias
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold text-emerald-700">
                      {availability.length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CUERPO */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.045)]">
            <PeopleList
              filteredPeople={filteredPeople}
              search={search}
              onSearchChange={handleSearchChange}
              loading={loadingPeople}
              selectedIds={selectedIds}
              lockedIds={normalizedLockedIds}
              onToggle={togglePerson}
            />
          </aside>

          <main className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.045)]">
            {/* Cabecera interna con selector de vista */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                  <CalendarCheck2 className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-700">Horarios en común</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Coincidencias entre todos los seleccionados.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedPeople.length >= 2 && (
                  <div className="flex w-fit items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-[8px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                        Tiempo disponible
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-700">
                        {getTotalDurationLabel(totalAvailableMinutes)}
                      </p>
                    </div>
                  </div>
                )}
                {/* Selector de vista */}
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("timeline")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      displayMode === "timeline"
                        ? "bg-white text-slate-700 shadow-sm"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    <Timeline className="h-4 w-4" strokeWidth={1.8} />
                    <span>Timeline</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("cards")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      displayMode === "cards"
                        ? "bg-white text-slate-700 shadow-sm"
                        : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" strokeWidth={1.8} />
                    <span>Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SELECCIONADOS */}
            {selectedPeople.length > 0 && (
              <div className="mb-5">
                <SelectedPeople
                  selectedPeople={selectedPeople}
                  lockedIds={normalizedLockedIds}
                  onRemove={removePerson}
                  onClear={clearSelection}
                />
              </div>
            )}

            {/* ESTADOS */}
            {selectedPeople.length < 2 ? (
              <div className="flex min-h-[470px] animate-[fadeUp_.35s_ease-out] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100">
                    <UsersRound className="h-9 w-9" strokeWidth={1.5} />
                  </div>
                  <p className="mt-6 text-base font-extrabold text-slate-700">
                    Encuentra un horario común
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-slate-400">
                    Selecciona al menos dos personas para comparar automáticamente sus horarios
                    disponibles.
                  </p>
                  <div className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-500 ring-1 ring-slate-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {selectedPeople.length === 0
                      ? "Ninguna persona seleccionada"
                      : "1 persona seleccionada"}
                  </div>
                </div>
              </div>
            ) : availability.length ? (
              <div className="animate-[fadeUp_.35s_ease-out]">
                {displayMode === "timeline" ? (
                  <WeeklyTimeline
                    availability={availability}
                    onSelect={createMeetingFromAvailability}
                  />
                ) : (
                  <AvailabilityCards
                    availability={availability}
                    onSelect={createMeetingFromAvailability}
                  />
                )}
              </div>
            ) : (
              <div className="flex min-h-[470px] animate-[fadeUp_.35s_ease-out] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                <div className="max-w-sm">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                    <Clock3 className="h-9 w-9" strokeWidth={1.5} />
                  </div>
                  <p className="mt-6 text-base font-extrabold text-slate-700">
                    No hay horarios en común
                  </p>
                  <p className="mx-auto mt-2 max-w-xs text-[11px] leading-5 text-slate-400">
                    Las personas seleccionadas no comparten ningún bloque disponible entre las 08:00
                    y las 18:00.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default DisponibilidadIntegrantes;
