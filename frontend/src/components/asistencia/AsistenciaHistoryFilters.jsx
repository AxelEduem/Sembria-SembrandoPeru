import { CalendarDays, SlidersHorizontal, X } from "lucide-react";

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
`;

export default function AsistenciaHistoryFilters({ filters, onChange, onClear }) {
  const hasFilters =
    filters.status !== "todos" ||
    filters.period !== "todos" ||
    filters.incidents !== "todos" ||
    Boolean(filters.date);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(190px,1fr)_minmax(190px,1fr)_minmax(190px,1fr)_200px_auto] xl:items-center">
        <div className="relative w-full">
          <SlidersHorizontal
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <select
            aria-label="Filtrar por estado"
            value={filters.status}
            onChange={(event) => onChange("status", event.target.value)}
            className={selectClass}
          >
            <option value="todos">Selecciona un estado</option>
            <option value="completada">Completada</option>
            <option value="en_jornada">En jornada</option>
            <option value="jornada_abierta">Jornada abierta</option>
            <option value="falta">Falta</option>
            <option value="justificada">Justificada</option>
          </select>
        </div>

        <div className="relative w-full">
          <CalendarDays
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <select
            aria-label="Filtrar por período"
            value={filters.period}
            onChange={(event) => onChange("period", event.target.value)}
            className={selectClass}
          >
            <option value="todos">Selecciona un período</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="90">Últimos 90 días</option>
            <option value="365">Último año</option>
          </select>
        </div>

        <div className="relative w-full">
          <SlidersHorizontal
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <select
            aria-label="Filtrar por incidencias"
            value={filters.incidents}
            onChange={(event) => onChange("incidents", event.target.value)}
            className={selectClass}
          >
            <option value="todos">Todas las incidencias</option>
            <option value="con">Con incidencias</option>
            <option value="sin">Sin incidencias</option>
          </select>
        </div>

        <div className="relative w-full">
          <CalendarDays
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />
          <Input
            type="date"
            aria-label="Filtrar por fecha exacta"
            value={filters.date}
            onChange={(event) => onChange("date", event.target.value)}
            className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          disabled={!hasFilters}
          className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none xl:w-auto ${
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
