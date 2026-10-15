import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

function AplicacionesFilters({
  search,
  areaFilter,
  dateFilter,
  statusFilter,
  statusOptions = [],
  areas = [],
  showAreaFilter = true,
  onSearchChange,
  onAreaFilterChange,
  onDateFilterChange,
  onStatusFilterChange,
}) {
  const resolvedStatusOptions =
    statusOptions.length > 0
      ? statusOptions
      : [
          {
            value: "todos",
            label: "Todos los estados",
          },
          {
            value: "activo",
            label: "Activo",
          },
          {
            value: "inactivo",
            label: "Inactivo",
          },
        ];

  const defaultStatus = resolvedStatusOptions[0]?.value || "todos";

  const hasAreaFilter = showAreaFilter && areaFilter !== "todas";

  const hasStatusFilter = Boolean(statusFilter) && statusFilter !== defaultStatus;

  const hasFilters =
    Boolean(search?.trim()) || Boolean(dateFilter) || hasAreaFilter || hasStatusFilter;

  function handleClearFilters() {
    if (!hasFilters) {
      return;
    }

    onSearchChange("");

    if (showAreaFilter) {
      onAreaFilterChange("todas");
    }

    onDateFilterChange("");
    onStatusFilterChange(defaultStatus);
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        {/* FILA 1 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)] lg:items-center">
          {/* BUSCAR */}
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <Input
              placeholder="Buscar por nombre de la aplicación..."
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          {/* ÁREA */}
          {showAreaFilter ? (
            <div className="relative w-full">
              <SlidersHorizontal
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                strokeWidth={1.8}
              />

              <select
                value={areaFilter}
                onChange={(event) => onAreaFilterChange(event.target.value)}
                className={selectClass}
              >
                <option value="todas">Selecciona un área</option>

                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nombre}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>

        {/* FILA 2 */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
          {/* ESTADO */}
          <div className="relative w-full">
            <SlidersHorizontal
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className={selectClass}
            >
              {resolvedStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* FECHA */}
          <div className="relative w-full">
            <CalendarDays
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => onDateFilterChange(event.target.value)}
              className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* LIMPIAR */}
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
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

export default AplicacionesFilters;
