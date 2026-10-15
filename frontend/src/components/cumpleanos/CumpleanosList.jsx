import { Badge } from "@/components/ui/badge";
import TablePagination from "@/components/ui/TablePagination";
import BirthdayRow from "./BirthdayRow";
import CumpleanosCalendar from "./CumpleanosCalendar";
import { List, CalendarRange, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CumpleanosList({
  view,
  setView,
  filteredRows,
  paginatedRows,
  loading,
  hasFilters,
  resetFilters,
  calendarMonth,
  setCalendarMonth,
  rangeLabel,
  birthdayPage,
  setBirthdayPage,
  birthdayTotalPages,
  birthdayPageSize,
}) {
  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Lista priorizada
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900">
              Próximos cumpleaños · cargando...
            </h2>
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-rose-200 border-t-rose-600" />
          <p className="text-sm font-medium text-slate-700">Cargando cumpleaños...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="cumpleanos-list-shell overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="cumpleanos-list-header flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            {view === "list" ? "Lista priorizada" : "Vista calendario"}
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            {view === "list"
              ? `Próximos cumpleaños · ${rangeLabel}`
              : "Calendario de cumpleaños"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden bg-slate-50 text-slate-600 sm:flex">
            {filteredRows.length} visibles
          </Badge>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold transition-all ${
                view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setView("calendar")}
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold transition-all ${
                view === "calendar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Calendario
            </button>
          </div>
        </div>
      </div>

      <div key={view} className="cumpleanos-view-transition">
        {view === "list" ? (
          <div className="divide-y divide-slate-100">
            {filteredRows.length ? (
              paginatedRows.map((row, index) => (
                <BirthdayRow key={row.id} row={row} index={index} />
              ))
            ) : (
              <div className="px-5 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                  <Search className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  No encontramos cumpleaños.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Prueba cambiar la búsqueda o los filtros.
                </p>
                {hasFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="mt-4"
                  >
                    Limpiar filtros
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <CumpleanosCalendar
            rows={filteredRows}
            calendarMonth={calendarMonth}
            setCalendarMonth={setCalendarMonth}
          />
        )}
      </div>

      {view === "list" && filteredRows.length > 0 && (
        <TablePagination
          currentPage={birthdayPage}
          endRow={Math.min(birthdayPage * birthdayPageSize, filteredRows.length)}
          itemLabel="cumpleaños"
          onNext={() => setBirthdayPage((page) => Math.min(birthdayTotalPages, page + 1))}
          onPrevious={() => setBirthdayPage((page) => Math.max(1, page - 1))}
          pageSize={birthdayPageSize}
          startRow={(birthdayPage - 1) * birthdayPageSize + 1}
          totalItems={filteredRows.length}
          totalPages={birthdayTotalPages}
        />
      )}
    </section>
  );
}