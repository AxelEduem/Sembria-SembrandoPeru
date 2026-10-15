import {
  MapPin,
  Search,
  Users2,
  X,
} from "lucide-react";

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
  px-3
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

const RANGE_OPTIONS = [
  { value: 15, label: "15 días" },
  { value: 30, label: "30 días" },
  { value: 60, label: "60 días" },
  { value: 90, label: "90 días" },
  { value: 365, label: "Todos" },
];

function CumpleanosFilters({
  range,
  search,
  areaFilter,
  typeFilter,
  areaOptions = [],
  typeOptions = [],
  onRangeChange,
  onSearchChange,
  onAreaFilterChange,
  onTypeFilterChange,
  onClear,
}) {
  const hasFilters =
    Boolean(search?.trim()) ||
    areaFilter !== "all" ||
    typeFilter !== "all" ||
    range !== 365;

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Filtros
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Selecciona el periodo y ajusta la búsqueda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => {
              const active = range === option.value;

              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => onRangeChange(option.value)}
                  className={`h-9 rounded-xl px-3 text-xs ${
                    active
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <Input
              placeholder="Buscar por nombre..."
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>

          <div className="relative w-full">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <select
              value={areaFilter}
              onChange={(event) => onAreaFilterChange(event.target.value)}
              className={`${selectClass} pl-9 pr-8`}
            >
              <option value="all">Selecciona un área</option>

              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <Users2
              className="pointer-events-none absolute top-1/2 left-3 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              strokeWidth={1.8}
            />

            <select
              value={typeFilter}
              onChange={(event) => onTypeFilterChange(event.target.value)}
              className={`${selectClass} pl-9 pr-8`}
            >
              <option value="all">Selecciona un tipo de integrante</option>

              {typeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
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

export default CumpleanosFilters;
