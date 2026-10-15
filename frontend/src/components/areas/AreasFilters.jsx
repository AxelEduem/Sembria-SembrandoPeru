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

function AreasFilters({
  search,
  statusFilter,
  dateFilter,
  statusOptions,
  onSearchChange,
  onStatusFilterChange,
  onDateFilterChange,
}) {
  const hasStatusFilter = Boolean(
    statusFilter &&
    statusOptions?.some((option) => option.value === statusFilter && option.value !== "todas"),
  );

  const hasFilters = Boolean(search) || Boolean(dateFilter) || hasStatusFilter;

  function handleClearFilters() {
    onSearchChange("");

    const defaultStatus =
      statusOptions?.find((option) => option.value === "todas")?.value || "todas";

    onStatusFilterChange(defaultStatus);

    onDateFilterChange("");
  }

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1.7fr)_210px_200px_auto] lg:items-center">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.8}
          />

          <Input
            placeholder="Buscar por nombre del área..."
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
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            className={selectClass}
          >
            {statusOptions?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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
            value={dateFilter}
            onChange={(event) => onDateFilterChange(event.target.value)}
            className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>

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
    </section>
  );
}

export default AreasFilters;
