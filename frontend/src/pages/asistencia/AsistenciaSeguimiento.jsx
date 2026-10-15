/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AttendanceAdminNav from "@/components/asistencia/AttendanceAdminNav";
import SeguimientoFilters from "@/components/asistencia/seguimiento/SeguimientoFilters";
import SeguimientoList from "@/components/asistencia/seguimiento/SeguimientoList";
import SeguimientoStyles from "@/components/asistencia/seguimiento/SeguimientoStyles";
import FeedbackToast from "@/components/ui/FeedbackToast";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { getCalendarioAsistencia, getSeguimientoJornadas } from "@/services/asistencia/asistenciaService";
import { attendanceDetailUrl, attendanceStatus, limaToday } from "@/utils/attendanceTracking";
import { downloadExcel } from "@/utils/excelExport";

const STATUS_OPTIONS = ["Próximo", "Inicio pendiente", "En jornada", "Completada", "Tardanza", "Salida anticipada", "Falta", "Justificada", "Permiso", "Anulada por feriado", "Sin jornada"];
const PARAM_MAP = { search: "q", area: "area", cargo: "cargo", state: "estado", date: "fecha", page: "pagina" };

function exportRows(rows, date) {
  downloadExcel({
    headers: ["Fecha", "Integrante", "Correo", "Cargo", "Área", "Horario", "Entrada", "Salida", "Estado", "Tardanza (min)", "Salida anticipada (min)", "Tiempo realizado (min)"],
    data: rows.map((row) => [row.fecha || date, row.integrante, row.correo, row.cargo, row.area, row.horario_id ? `${String(row.hora_inicio_programada).slice(0, 5)} - ${String(row.hora_fin_programada).slice(0, 5)}` : "Sin jornada", row.hora_entrada || "", row.hora_salida || "", row.seguimiento, row.minutos_tardanza || 0, row.minutos_salida_anticipada || 0, row.minutos_realizados || 0]),
  }, `gestion_asistencia_${date}.xlsx`);
}

export default function AsistenciaSeguimiento() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentDate = limaToday();
  const defaults = useMemo(() => ({ search: "", area: "", cargo: "", state: "", date: currentDate, page: "1" }), [currentDate]);
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({ paramMap: PARAM_MAP, defaults });
  const filters = readInitialFilters();
  const selectedDate = filters.date && filters.date <= currentDate ? filters.date : currentDate;
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const [rows, setRows] = useState([]);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const mountedRef = useRef(true);
  const selectedDateRef = useRef(selectedDate);
  const loadInFlightRef = useRef(false);
  const loadDateRef = useRef(null);
  const pendingDateRefreshRef = useRef(false);
  const latestLoadRef = useRef(null);

  selectedDateRef.current = selectedDate;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const update = useCallback((key, value) => writeFiltersToUrl({ ...filters, [key]: value, page: key === "page" ? String(value) : "1" }), [filters, writeFiltersToUrl]);
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (loadInFlightRef.current) {
      if (loadDateRef.current !== selectedDate) {
        pendingDateRefreshRef.current = true;
      }
      return false;
    }

    loadInFlightRef.current = true;
    loadDateRef.current = selectedDate;

    try {
      const [trackingRows, holidays] = await Promise.all([
        getSeguimientoJornadas(selectedDate, { force: silent }),
        getCalendarioAsistencia(selectedDate, selectedDate, { force: silent }),
      ]);

      if (!mountedRef.current || selectedDateRef.current !== selectedDate) {
        return false;
      }

      setRows(trackingRows || []);
      setSelectedHoliday((holidays || [])[0] || null);
      setLastUpdated(new Date());
      return true;
    } catch (error) {
      if (mountedRef.current && selectedDateRef.current === selectedDate) {
        if (!silent) setRows([]);
        setFeedback({ type: "error", message: error?.message || "No se pudo cargar la gestión de asistencia." });
      }
      return false;
    } finally {
      const isCurrentDate = selectedDateRef.current === selectedDate;
      loadInFlightRef.current = false;
      loadDateRef.current = null;

      if (mountedRef.current && isCurrentDate) {
        setLoading(false);
      }

      if (mountedRef.current && pendingDateRefreshRef.current) {
        pendingDateRefreshRef.current = false;
        if (document.visibilityState === "visible" && navigator.onLine) {
          void latestLoadRef.current?.({ silent: true });
        }
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    latestLoadRef.current = load;

    const refreshWhenActive = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void load({ silent: true });
      }
    };

    if (document.visibilityState === "visible" && navigator.onLine) {
      void load();
    }

    const interval = window.setInterval(refreshWhenActive, 15_000);
    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);

      if (latestLoadRef.current === load) {
        latestLoadRef.current = null;
      }
    };
  }, [load]);

  const decorated = useMemo(() => {
    const list = rows.map((row) => ({
      ...row,
      seguimiento: attendanceStatus(row, row.fecha || selectedDate),
    }));

    return list;
  }, [rows, selectedDate]);

  const areaOptions = useMemo(() => [...new Set(rows.map((row) => row.area).filter(Boolean))].sort((first, second) => first.localeCompare(second, "es")), [rows]);
  const cargoOptions = useMemo(() => {
    if (!filters.area) return [];
    return [...new Map(rows.filter((row) => row.area === filters.area && row.cargo_id).map((row) => [String(row.cargo_id), { id: row.cargo_id, nombre: row.cargo }])).values()]
      .sort((first, second) => String(first.nombre || "").localeCompare(String(second.nombre || ""), "es"));
  }, [filters.area, rows]);
  const visible = useMemo(() => { const term = filters.search.trim().toLocaleLowerCase("es-PE"); return decorated.filter((row) => (!term || `${row.integrante || ""} ${row.correo || ""}`.toLocaleLowerCase("es-PE").includes(term)) && (!filters.area || row.area === filters.area) && (!filters.cargo || String(row.cargo_id) === filters.cargo) && (!filters.state || row.seguimiento === filters.state)); }, [decorated, filters.area, filters.cargo, filters.search, filters.state]);
  const hasFilters = Boolean(filters.search || filters.area || filters.cargo || filters.state || selectedDate !== currentDate);
  const updateArea = (value) => writeFiltersToUrl({ ...filters, area: value, cargo: "", page: "1" });
  const clear = () => writeFiltersToUrl(defaults);

  const loadingCombined = loading;

  return <div className="module-page-enter min-h-full space-y-4 pb-10">
    <SeguimientoStyles /><FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} /><AttendanceAdminNav onExport={() => exportRows(visible, selectedDate)} exportDisabled={loadingCombined || !visible.length} />
    <SeguimientoFilters search={filters.search} setSearch={(value) => update("search", value)} date={selectedDate} maxDate={currentDate} setDate={(value) => update("date", value)} area={filters.area} setArea={updateArea} areas={areaOptions} areasLoading={loading} cargo={filters.cargo} setCargo={(value) => update("cargo", value)} cargos={cargoOptions} cargosLoading={loading} state={filters.state} setState={(value) => update("state", value)} states={STATUS_OPTIONS} hasFilters={hasFilters} onClear={clear} />
    {selectedHoliday ? <div className={`rounded-2xl border px-4 py-3 text-sm ${selectedHoliday.requiere_asistencia ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><span className="font-bold">{selectedHoliday.nombre}.</span> {selectedHoliday.requiere_asistencia ? "La organización exige asistencia en esta fecha." : "No corresponde controlar asistencia ni generar faltas."}</div> : null}
    <p className="-mt-2 text-right text-[11px] text-slate-400">Actualización automática cada 15 segundos{lastUpdated ? ` · Última sincronización ${new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(lastUpdated)}` : ""}</p>
    <SeguimientoList rows={visible} loading={loadingCombined} hasFilters={hasFilters} onClearFilters={clear} currentPage={page} onPageChange={(value) => update("page", value)} onOpenDetail={(row) => navigate(attendanceDetailUrl(row), { state: { from: `${location.pathname}${location.search}` } })} />
  </div>;
}
