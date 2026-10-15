import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pr-9 pl-9 text-sm text-slate-700 shadow-none outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

export default function TareasFilters({
  search,
  view,
  status,
  priority,
  dueDate,
  onSearchChange,
  onViewChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onClear,
}) {
  const hasFilters = Boolean(search.trim())
    || view !== "all"
    || status !== "pendiente"
    || priority !== "todas"
    || Boolean(dueDate);

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por tarea, descripción o integrante..."
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <FilterSelect id="task-view-filter" label="Vista de tareas" value={view} onChange={onViewChange}>
            <option value="mine">Mis tareas</option>
            <option value="assigned">Asignadas por mí</option>
            <option value="all">Todas las tareas relacionadas</option>
          </FilterSelect>

          <FilterSelect id="task-status-filter" label="Estado" value={status} onChange={onStatusChange}>
            <option value="pendiente">Pendientes</option>
            <option value="todas">Todos los estados</option>
            <option value="en_progreso">En progreso</option>
            <option value="completada">Completadas</option>
            <option value="cancelada">Canceladas</option>
          </FilterSelect>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
          <FilterSelect id="task-priority-filter" label="Prioridad" value={priority} onChange={onPriorityChange}>
            <option value="todas">Todas las prioridades</option>
            <option value="baja">Prioridad baja</option>
            <option value="media">Prioridad media</option>
            <option value="alta">Prioridad alta</option>
            <option value="urgente">Prioridad urgente</option>
          </FilterSelect>

          <div className="relative w-full">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <label className="sr-only" htmlFor="task-date-filter">Fecha límite</label>
            <Input
              id="task-date-filter"
              type="date"
              value={dueDate}
              onChange={(event) => onDueDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onClear}
            disabled={!hasFilters}
            className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none lg:w-auto ${
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

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <div className="relative w-full">
      <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
      <label className="sr-only" htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {children}
      </select>
    </div>
  );
}
