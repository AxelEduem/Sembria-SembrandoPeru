import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIntegrantesContext } from "@/contexts/IntegrantesContext";

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

function IntegrantesFilters() {
  const {
    search,
    areaFilter,
    cargoFilter,
    typeFilter,
    periodFilter,
    statusFilter,
    dateFilter,
    statusOptions,
    periodOptions,
    areas,
    cargos,
    areaLocked,
    allowedAreaId,
    setSearch,
    setAreaFilter,
    setCargoFilter,
    setTypeFilter,
    setPeriodFilter,
    setStatusFilter,
    setDateFilter,
  } = useIntegrantesContext();

  const resolvedStatusOptions =
    statusOptions.length > 0
      ? statusOptions
      : [
          { value: "todos", label: "Selecciona un estado" },
          { value: "activo", label: "Activo" },
          { value: "inactivo", label: "Inactivo" },
        ];

  const resolvedPeriodOptions = periodOptions.length > 0 ? periodOptions : [];

  const normalizedAllowedAreaId =
    allowedAreaId !== null && allowedAreaId !== undefined && allowedAreaId !== ""
      ? String(allowedAreaId)
      : null;

  const visibleAreas =
    areaLocked && normalizedAllowedAreaId
      ? areas.filter((area) => String(area.id) === normalizedAllowedAreaId)
      : areas;

  const hasSearch = Boolean(String(search).trim());
  const hasAreaFilter = !areaLocked && areaFilter !== "todas";
  const hasCargoFilter = cargoFilter !== "todos";
  const hasTypeFilter = typeFilter !== "todos";
  const hasPeriodFilter = periodFilter !== "todos";
  const defaultStatus = resolvedStatusOptions[0]?.value || "todos";
  const hasStatusFilter = statusFilter !== defaultStatus && statusFilter !== "todos";
  const hasDateFilter = Boolean(dateFilter);
  const hasFilters =
    hasSearch ||
    hasAreaFilter ||
    hasCargoFilter ||
    hasTypeFilter ||
    hasPeriodFilter ||
    hasStatusFilter ||
    hasDateFilter;

  function clearFilters() {
    if (!hasFilters) return;
    setSearch("");
    if (!areaLocked) setAreaFilter("todas");
    setCargoFilter("todos");
    setTypeFilter("todos");
    setPeriodFilter("todos");
    setStatusFilter(defaultStatus);
    setDateFilter("");
  }

  function handleAreaChange(value) {
    if (areaLocked) return;
    setAreaFilter(value);
    setCargoFilter("todos");
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, correo, DNI o teléfono..."
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select
              value={areaFilter}
              onChange={(event) => handleAreaChange(event.target.value)}
              disabled={areaLocked}
              className={selectClass}
            >
              {areaLocked ? (
                <option value={normalizedAllowedAreaId || areaFilter}>
                  {visibleAreas[0]?.nombre || "Área asignada"}
                </option>
              ) : (
                <>
                  <option value="todas">Selecciona un área</option>
                  {visibleAreas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className={selectClass}
            >
              <option value="todos">Selecciona un tipo</option>
              <option value="voluntario">Voluntario</option>
              <option value="practicante">Practicante</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-center">
          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select
              value={cargoFilter}
              onChange={(event) => setCargoFilter(event.target.value)}
              disabled={areaFilter === "todas"}
              className={selectClass}
            >
              <option value="todos">
                {areaFilter === "todas" ? "Selecciona un área primero" : "Selecciona un cargo"}
              </option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id}>
                  {cargo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select
              value={periodFilter}
              onChange={(event) => setPeriodFilter(event.target.value)}
              className={selectClass}
            >
              <option value="todos">Selecciona un período</option>
              {resolvedPeriodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={selectClass}
            >
              {resolvedStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
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

export default IntegrantesFilters;
