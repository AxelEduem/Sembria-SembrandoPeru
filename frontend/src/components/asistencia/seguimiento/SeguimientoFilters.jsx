import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = `
  h-10
  w-full
  cursor-pointer
  appearance-none
  rounded-xl
  border
  border-slate-200
  bg-white
  pr-8
  pl-9
  text-sm
  text-slate-700
  transition-none
  outline-none
  hover:border-slate-200
  hover:bg-white
  focus:border-emerald-500
  focus:ring-4
  focus:ring-emerald-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-50
  disabled:text-slate-400
`;

export default function SeguimientoFilters({
  search,
  setSearch,
  date,
  maxDate,
  setDate,
  area,
  setArea,
  areas,
  areasLoading = false,
  cargo,
  setCargo,
  cargos,
  cargosLoading = false,
  state,
  setState,
  states,
  hasFilters,
  onClear,
}) {
  return (
    <section className="module-section-enter module-enter-delay-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
          <div className="relative w-full md:col-span-2 lg:col-span-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o correo..."
              aria-label="Buscar por nombre o correo"
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="relative w-full">
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              disabled={areasLoading}
              aria-label="Filtrar por área"
              className={selectClass}
            >
              <option value="">
                {areasLoading ? "Cargando áreas..." : "Todas las áreas"}
              </option>
              {areas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <select
              value={cargo}
              onChange={(event) => setCargo(event.target.value)}
              disabled={!area || cargosLoading}
              aria-label="Filtrar por cargo"
              className={selectClass}
            >
              <option value="">
                {!area
                  ? "Selecciona un área primero"
                  : cargosLoading
                    ? "Cargando cargos..."
                    : "Selecciona un cargo"}
              </option>
              {cargos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_auto] lg:items-center">
          <div className="relative w-full">
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <select
              value={state}
              onChange={(event) => setState(event.target.value)}
              aria-label="Filtrar por estado de jornada"
              className={selectClass}
            >
              <option value="">Todos los estados</option>
              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <CalendarDays
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />
            <Input
              type="date"
              value={date}
              max={maxDate}
              onChange={(event) => setDate(event.target.value)}
              aria-label="Fecha de seguimiento"
              className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={!hasFilters}
            className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium whitespace-nowrap shadow-none transition-none lg:w-auto ${
              hasFilters
                ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            }`}
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
            Limpiar filtros
          </Button>
        </div>
      </div>
    </section>
  );
}
