/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarOff,
  History,
  Info,
  Landmark,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { Input } from "@/components/ui/input";
import TablePagination from "@/components/ui/TablePagination";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import {
  actualizarTratamientoDiaNoLaborable,
  eliminarDiaNoLaborable,
  getFlujosAsistencia,
  registrarDiaNoLaborable,
} from "@/services/asistencia/asistenciaService";
import { limaToday } from "@/utils/attendanceTracking";

const PAGE_SIZE = 8;
const PARAM_MAP = {
  search: "q",
  date: "fecha",
  type: "tipo",
  treatment: "tratamiento",
  period: "periodo",
  page: "pagina",
};
const DEFAULTS = {
  search: "",
  date: "",
  type: "",
  treatment: "",
  period: "proximos",
  page: "1",
};
const selectClass = "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50/60 pr-8 pl-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function AttendanceHolidaysAdmin() {
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: PARAM_MAP,
    defaults: DEFAULTS,
  });
  const filters = readInitialFilters();
  const period = filters.period === "anteriores" ? "anteriores" : "proximos";
  const today = limaToday();
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const [days, setDays] = useState([]);
  const [holiday, setHoliday] = useState({ fecha: "", nombre: "" });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFlujosAsistencia("configuracion");
      setDays(result.dias_no_laborables || []);
    } catch (error) {
      setDays([]);
      setFeedback({
        type: "error",
        message: error?.message || "No se pudo cargar el calendario laboral.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(work, message) {
    setBusy(true);
    try {
      await work();
      setFeedback({ type: "success", message });
      await load();
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error?.message || "No se pudo completar la operación.",
      });
      return false;
    } finally {
      setBusy(false);
    }
  }

  const periodCounts = useMemo(() => days.reduce((counts, item) => {
    if (item.fecha < today) counts.anteriores += 1;
    else counts.proximos += 1;
    return counts;
  }, { proximos: 0, anteriores: 0 }), [days, today]);

  const filteredDays = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("es-PE");

    return [...days]
      .filter((item) =>
        (period === "anteriores" ? item.fecha < today : item.fecha >= today)
        && (!term || String(item.nombre || "").toLocaleLowerCase("es-PE").includes(term))
        && (!filters.date || item.fecha === filters.date)
        && (!filters.type || (filters.type === "oficial" ? Boolean(item.es_oficial) : !item.es_oficial))
        && (!filters.treatment || (filters.treatment === "laborable" ? Boolean(item.requiere_asistencia) : !item.requiere_asistencia))
      )
      .sort((first, second) => period === "anteriores"
        ? String(second.fecha).localeCompare(String(first.fecha))
        : String(first.fecha).localeCompare(String(second.fecha)));
  }, [days, filters.date, filters.search, filters.treatment, filters.type, period, today]);

  const totalPages = Math.max(1, Math.ceil(filteredDays.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleDays = filteredDays.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(filters.search || filters.date || filters.type || filters.treatment);
  const updateFilter = (key, value) => writeFiltersToUrl({ ...filters, [key]: value, page: "1" });
  const clearFilters = () => writeFiltersToUrl({ ...DEFAULTS, period });

  return (
    <div className="space-y-5">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CalendarOff className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="font-semibold text-slate-900">Calendario laboral y excepciones</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              Revisa los feriados nacionales y los días institucionales. En cada fecha puedes decidir explícitamente si se controla asistencia.
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                <CalendarOff className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-900">No laborable</p>
                <p className="mt-1 text-[11px] leading-5 text-emerald-800/80">No se solicita asistencia ni se generan faltas o recuperaciones.</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                <CalendarCheck2 className="h-4.5 w-4.5" strokeWidth={1.8} />
              </span>
              <div>
                <p className="text-xs font-bold text-amber-900">Laborable por excepción</p>
                <p className="mt-1 text-[11px] leading-5 text-amber-800/80">Aunque la fecha esté registrada, la asistencia se controla normalmente.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                <Building2 className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Agregar día institucional sin asistencia</h2>
                <p className="mt-0.5 text-[11px] leading-5 text-slate-500">Los feriados nacionales se cargan automáticamente. Usa este formulario solo para fechas propias de la organización.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(180px,0.7fr)_minmax(260px,1.3fr)_auto] sm:items-end">
              <label className="text-xs font-semibold text-slate-700">
                Fecha
                <Input
                  type="date"
                  value={holiday.fecha}
                  onChange={(event) => setHoliday((value) => ({ ...value, fecha: event.target.value }))}
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Motivo o nombre del día
                <Input
                  value={holiday.nombre}
                  onChange={(event) => setHoliday((value) => ({ ...value, nombre: event.target.value }))}
                  placeholder="Ej. Aniversario institucional"
                  className="mt-2 h-11 rounded-xl border-slate-200 bg-white text-sm shadow-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                />
              </label>
              <ActionButton
                action="create"
                type="button"
                loading={busy}
                loadingText="Agregando..."
                disabled={!holiday.fecha || !holiday.nombre.trim()}
                onClick={() => void run(
                  () => registrarDiaNoLaborable(holiday),
                  "Día institucional registrado como no laborable.",
                ).then((saved) => {
                  if (saved) setHoliday({ fecha: "", nombre: "" });
                })}
                className="h-11 bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white"
              >
                Agregar fecha
              </ActionButton>
            </div>
          </div>
        </div>
      </section>

      <section className="module-section-enter module-enter-delay-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(180px,0.8fr)_minmax(190px,0.8fr)_minmax(210px,0.9fr)_auto]">
          <label className="relative md:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Buscar feriado por nombre..."
              aria-label="Buscar feriado por nombre"
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <label className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input
              type="date"
              value={filters.date}
              onChange={(event) => updateFilter("date", event.target.value)}
              aria-label="Filtrar por fecha"
              className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pr-3 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)} className={selectClass} aria-label="Filtrar por tipo de fecha">
              <option value="">Todos los tipos</option>
              <option value="oficial">Feriado nacional</option>
              <option value="institucional">Día institucional</option>
            </select>
          </label>
          <label className="relative">
            <CalendarCheck2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={filters.treatment} onChange={(event) => updateFilter("treatment", event.target.value)} className={selectClass} aria-label="Filtrar por tratamiento del día">
              <option value="">Todos los tratamientos</option>
              <option value="no_laborable">No laborable</option>
              <option value="laborable">Laborable por excepción</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            disabled={!hasFilters}
            className={`h-10 gap-2 rounded-xl ${hasFilters ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" : "bg-slate-50 text-slate-300"}`}
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </div>
      </section>

      <section className="module-section-enter module-enter-delay-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 bg-slate-50/50 p-2 sm:px-5 sm:py-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:inline-grid sm:min-w-[430px]" role="tablist" aria-label="Periodo de feriados">
            <button
              type="button"
              role="tab"
              aria-selected={period === "proximos"}
              onClick={() => writeFiltersToUrl({ ...filters, period: "proximos", page: "1" })}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${period === "proximos" ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
            >
              <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
              Próximos
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${period === "proximos" ? "bg-white/80 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>{periodCounts.proximos}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={period === "anteriores"}
              onClick={() => writeFiltersToUrl({ ...filters, period: "anteriores", page: "1" })}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${period === "anteriores" ? "bg-slate-200 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}
            >
              <History className="h-4 w-4" strokeWidth={1.8} />
              Anteriores
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${period === "anteriores" ? "bg-white/80 text-slate-700" : "bg-slate-100 text-slate-500"}`}>{periodCounts.anteriores}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{period === "anteriores" ? "Feriados anteriores" : "Próximos feriados"}</h2>
            <p className="mt-1 text-[11px] text-slate-500">
              {period === "anteriores"
                ? "Consulta las fechas pasadas, ordenadas desde la más reciente."
                : "Aquí aparecen únicamente las fechas de hoy en adelante, empezando por la más cercana."}
            </p>
          </div>
          {!loading ? (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
              {filteredDays.length} {filteredDays.length === 1 ? "resultado" : "resultados"}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : visibleDays.length ? (
          <div>
            {visibleDays.map((item, index) => {
              const requiresAttendance = Boolean(item.requiere_asistencia);
              const TypeIcon = item.es_oficial ? Landmark : Building2;
              return (
                <article
                  key={item.id}
                  className={`grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(210px,auto)_auto] sm:items-center sm:px-5 ${index ? "border-t border-slate-100" : ""}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${requiresAttendance ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                      <TypeIcon className="h-4.5 w-4.5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">{item.nombre}</h3>
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-slate-500 uppercase">
                          {item.es_oficial ? "Feriado nacional" : "Día institucional"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(item.fecha)}</p>
                      <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${requiresAttendance ? "text-amber-700" : "text-emerald-700"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${requiresAttendance ? "bg-amber-500" : "bg-emerald-500"}`} />
                        {requiresAttendance ? "Se controlará la asistencia normalmente" : "No se solicitará asistencia ni se generarán faltas"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Tratamiento del día</p>
                    <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={`Tratamiento de ${item.nombre}`}>
                      <button
                        type="button"
                        aria-pressed={requiresAttendance}
                        disabled={busy || requiresAttendance}
                        onClick={() => void run(
                          () => actualizarTratamientoDiaNoLaborable(item.id, true),
                          "Día marcado como laborable; se controlará la asistencia.",
                        )}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${requiresAttendance ? "bg-amber-100 text-amber-900 shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"} disabled:cursor-default`}
                      >
                        Laborable
                      </button>
                      <button
                        type="button"
                        aria-pressed={!requiresAttendance}
                        disabled={busy || !requiresAttendance}
                        onClick={() => void run(
                          () => actualizarTratamientoDiaNoLaborable(item.id, false),
                          "Día marcado como no laborable; no se solicitará asistencia.",
                        )}
                        className={`rounded-lg px-3 py-2 text-[11px] font-bold transition ${!requiresAttendance ? "bg-emerald-100 text-emerald-900 shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-700"} disabled:cursor-default`}
                      >
                        No laborable
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end sm:w-9">
                    {!item.es_oficial ? (
                      <button
                        type="button"
                        aria-label={`Eliminar ${item.nombre}`}
                        title="Eliminar día institucional"
                        disabled={busy}
                        className="rounded-xl border border-transparent p-2 text-slate-400 transition-colors hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        onClick={() => void run(() => eliminarDiaNoLaborable(item.id), "Día institucional eliminado.")}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                      </button>
                    ) : (
                      <span title="Los feriados nacionales no se eliminan; puedes cambiar su tratamiento." className="rounded-lg p-2 text-slate-300">
                        <Info className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                    )}
                  </div>
                </article>
              );
            })}

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDays.length}
              pageSize={PAGE_SIZE}
              startRow={(currentPage - 1) * PAGE_SIZE + 1}
              endRow={Math.min(currentPage * PAGE_SIZE, filteredDays.length)}
              itemLabel="fechas"
              onPrevious={() => writeFiltersToUrl({ ...filters, page: String(Math.max(1, currentPage - 1)) })}
              onNext={() => writeFiltersToUrl({ ...filters, page: String(Math.min(totalPages, currentPage + 1)) })}
            />
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            {period === "anteriores" ? <History className="mx-auto h-7 w-7 text-slate-300" strokeWidth={1.6} /> : <CalendarOff className="mx-auto h-7 w-7 text-slate-300" strokeWidth={1.6} />}
            <p className="mt-3 text-sm font-semibold text-slate-700">{hasFilters ? "No hay fechas para estos filtros" : period === "anteriores" ? "Todavía no hay feriados anteriores" : "No hay próximos feriados"}</p>
            <p className="mt-1 text-xs text-slate-400">{hasFilters ? "Prueba modificar o limpiar los filtros aplicados." : period === "anteriores" ? "Las fechas pasarán automáticamente a este historial cuando finalice el día." : "Las próximas fechas nacionales e institucionales aparecerán aquí."}</p>
            {hasFilters ? <button type="button" onClick={clearFilters} className="mt-3 text-xs font-bold text-emerald-700">Limpiar filtros</button> : null}
          </div>
        )}
      </section>
    </div>
  );
}
