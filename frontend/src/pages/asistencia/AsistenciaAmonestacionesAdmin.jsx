/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, ShieldAlert, SlidersHorizontal, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import FeedbackToast from "@/components/ui/FeedbackToast";
import TablePagination from "@/components/ui/TablePagination";
import AttendanceMemberCell from "@/components/asistencia/AttendanceMemberCell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { getAmonestacionesAsistencia } from "@/services/asistencia/asistenciaService";

const PAGE_SIZE = 10;
const PARAM_MAP = { search: "q", area: "area", severity: "gravedad", page: "pagina" };
const DEFAULTS = { search: "", area: "", severity: "", page: "1" };
const selectClass = "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-8 pl-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const severityFields = {
  baja: "amonestaciones_bajas",
  media: "amonestaciones_medias",
  grave: "amonestaciones_graves",
};

export default function AsistenciaAmonestacionesAdmin() {
  const navigate = useNavigate();
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({ paramMap: PARAM_MAP, defaults: DEFAULTS });
  const filters = readInitialFilters();
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getAmonestacionesAsistencia());
    } catch (error) {
      setRows([]);
      setFeedback({ type: "error", message: error?.message || "No se pudieron cargar las amonestaciones." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const areas = useMemo(
    () => [...new Set(rows.map((item) => item.area).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second, "es")),
    [rows],
  );
  const filteredRows = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("es-PE");
    const severityField = severityFields[filters.severity];

    return rows.filter((item) =>
      (!term || `${item.integrante || ""} ${item.correo || ""}`.toLocaleLowerCase("es-PE").includes(term))
      && (!filters.area || item.area === filters.area)
      && (!severityField || Number(item[severityField]) > 0)
    );
  }, [filters.area, filters.search, filters.severity, rows]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(filters.search || filters.area || filters.severity);
  const updateFilter = (key, value) => writeFiltersToUrl({ ...filters, [key]: value, page: "1" });

  return (
    <div className="module-page-enter space-y-4 pb-10">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      <button
        type="button"
        onClick={() => navigate("/asistencia/administracion")}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a gestión de asistencia
      </button>

      <section className="module-section-enter module-enter-delay-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto]">
          <label className="relative md:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Buscar por nombre o correo..." aria-label="Buscar por nombre o correo" className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={filters.area} onChange={(event) => updateFilter("area", event.target.value)} className={selectClass} aria-label="Filtrar por área">
              <option value="">Selecciona un área</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="relative">
            <ShieldAlert className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={filters.severity} onChange={(event) => updateFilter("severity", event.target.value)} className={selectClass} aria-label="Filtrar por gravedad">
              <option value="">Selecciona una gravedad</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="grave">Grave</option>
            </select>
          </label>
          <Button type="button" variant="outline" onClick={() => writeFiltersToUrl(DEFAULTS)} disabled={!hasFilters} className={`h-10 gap-2 rounded-xl ${hasFilters ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" : "bg-slate-50 text-slate-300"}`}>
            <X className="h-4 w-4" />Limpiar filtros
          </Button>
        </div>
      </section>

      <section className="module-section-enter module-enter-delay-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="overflow-x-auto">
          <Table
            className="w-full min-w-[900px] table-fixed border-collapse"
            loading={loading}
            loadingLabel="Cargando amonestaciones..."
          >
            <thead><tr className="bg-slate-50/70">
              <th className="w-[28%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Integrante</th>
              <th className="w-[24%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Área y cargo</th>
              <th className="w-[12%] px-4 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Total</th>
              <th className="w-[12%] px-4 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Bajas</th>
              <th className="w-[12%] px-4 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Medias</th>
              <th className="w-[12%] px-4 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Graves</th>
            </tr></thead>
            <tbody>
              {loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className="border-t border-slate-100"><td colSpan={6} className="px-5 py-3"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></td></tr>) : visibleRows.map((item, index) => (
                <tr
                  key={item.integrante_id}
                  className="module-row-enter border-t border-slate-100 hover:bg-slate-50/50"
                  style={{ animationDelay: `${180 + index * 45}ms` }}
                >
                  <td className="px-4 py-4"><AttendanceMemberCell name={item.integrante} email={item.correo} avatarPath={item.avatar_path} avatarUrl={item.avatar_url} /></td>
                  <td className="px-4 py-4"><p className="text-xs font-semibold text-slate-700">{item.area || "Sin área"}</p><p className="mt-1 text-[11px] text-slate-400">{item.cargo || "Sin cargo"}</p></td>
                  <td className="px-4 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{item.amonestaciones_total}</span></td>
                  <td className="px-4 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{item.amonestaciones_bajas}</span></td>
                  <td className="px-4 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{item.amonestaciones_medias}</span></td>
                  <td className="px-4 py-4 text-center"><span className="inline-flex min-w-8 justify-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">{item.amonestaciones_graves}</span></td>
                </tr>
              ))}
              {!loading && !filteredRows.length ? <tr><td colSpan={6} className="px-6 py-14 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{hasFilters ? "No hay resultados para estos filtros" : "No hay integrantes disponibles"}</p><p className="mt-1 text-xs text-slate-400">{hasFilters ? "Intenta modificar o limpiar los filtros aplicados." : "Los integrantes activos aparecerán aquí con su resumen de amonestaciones."}</p></td></tr> : null}
            </tbody>
          </Table>
        </div>
        {!loading && filteredRows.length ? <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredRows.length} startRow={(currentPage - 1) * PAGE_SIZE + 1} endRow={Math.min(currentPage * PAGE_SIZE, filteredRows.length)} itemLabel="integrantes" onPrevious={() => writeFiltersToUrl({ ...filters, page: String(Math.max(1, currentPage - 1)) })} onNext={() => writeFiltersToUrl({ ...filters, page: String(Math.min(totalPages, currentPage + 1)) })} /> : null}
      </section>
    </div>
  );
}
