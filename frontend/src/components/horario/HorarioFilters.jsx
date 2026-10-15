import { Building2, Clock3, Search, SlidersHorizontal, X } from "lucide-react";

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
  disabled:hover:border-slate-200
`;

function HorarioFilters({
  areaFilter,
  areaOptions = [],
  cargoFilter,
  cargoOptions = [],
  hasFilters,
  hoursFilter,
  onAreaFilterChange,
  onCargoFilterChange,
  onClearFilters,
  onHoursFilterChange,
  onSearchChange,
  onTypeFilterChange,
  search,
  typeFilter,
}) {
  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4 lg:items-center">
        {/* Fila 1 */}
        <div className="relative w-full lg:col-span-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <Input
            placeholder="Buscar por nombre o correo..."
            className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="relative w-full">
          <SlidersHorizontal
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <select
            value={typeFilter}
            onChange={(event) => onTypeFilterChange(event.target.value)}
            className={selectClass}
          >
            <option value="todos">Selecciona un tipo de integrante</option>
            <option value="voluntarios">Voluntarios</option>
            <option value="practicantes">Practicantes</option>
            <option value="gerentes">Gerentes</option>
          </select>
        </div>

        <div className="relative w-full">
          <Building2
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <select
            value={areaFilter}
            onChange={(event) => onAreaFilterChange(event.target.value)}
            className={selectClass}
          >
            <option value="todas">Selecciona un área</option>

            {areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Fila 2 */}
        <div className="relative w-full">
          <Building2
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <select
            value={cargoFilter}
            onChange={(event) => onCargoFilterChange(event.target.value)}
            disabled={areaFilter === "todas"}
            className={selectClass}
          >
            <option value="todos">
              {areaFilter === "todas" ? "Selecciona un área primero" : "Selecciona un cargo"}
            </option>

            {cargoOptions.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full">
          <Clock3
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <select
            value={hoursFilter}
            onChange={(event) => onHoursFilterChange(event.target.value)}
            className={selectClass}
          >
            <option value="todas">Selecciona un rango mínimo de hora</option>
            <option value="10-15">10 - 15 horas</option>
            <option value="16-20">16 - 20 horas</option>
            <option value="21+">21+ horas</option>
          </select>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClearFilters}
          disabled={!hasFilters}
          className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none ${
            hasFilters
              ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
          }`}
        >
          <X className="h-4 w-4" strokeWidth={1.8} />
          Limpiar filtros
        </Button>
      </div>
    </section>
  );
}

export default HorarioFilters;
