/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, ClipboardCheck, FileCheck2, LogOut, Paperclip, Search, Settings2, ShieldCheck, SlidersHorizontal, X, XCircle } from "lucide-react";

import FeedbackToast from "@/components/ui/FeedbackToast";
import TablePagination from "@/components/ui/TablePagination";
import AttendanceMemberCell from "@/components/asistencia/AttendanceMemberCell";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { getFlujosAsistencia, guardarConfiguracionAsistencia, resolverJustificacion, resolverPermiso } from "@/services/asistencia/asistenciaService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const PAGE_SIZE = 8;
const typeLabels = {
  permiso: "Solicitud de permiso",
  falta: "Justificación de falta",
  tardanza: "Justificación de tardanza",
  salida_anticipada: "Justificación de salida anticipada",
};
const filterTypeLabels = {
  permiso: "Permiso",
  falta: "Falta",
  tardanza: "Tardanza",
  salida_anticipada: "Salida anticipada",
};
const typeStyles = {
  permiso: "bg-cyan-50 text-cyan-700",
  falta: "bg-rose-50 text-rose-700",
  tardanza: "bg-amber-50 text-amber-700",
  salida_anticipada: "bg-violet-50 text-violet-700",
};
const requestTypes = ["falta", "tardanza", "salida_anticipada", "permiso"];
const REQUEST_VIEWS = [
  { id: "falta", label: "Falta", icon: AlertTriangle, empty: "No hay solicitudes por faltas" },
  { id: "tardanza", label: "Tardanza", icon: Clock3, empty: "No hay solicitudes por tardanzas" },
  { id: "salida_anticipada", label: "Salida anticipada", icon: LogOut, empty: "No hay solicitudes por salidas anticipadas" },
  { id: "permiso", label: "Permiso", icon: ShieldCheck, empty: "No hay solicitudes de permiso" },
];
const requestParamMap = {
  search: "q",
  areaFilter: "area",
  typeFilter: "tipo",
  stateFilter: "estado",
  dateFilter: "fecha",
  attachmentFilter: "adjunto",
  page: "pagina",
};
const requestFilterDefaults = {
  search: "",
  areaFilter: "",
  typeFilter: "",
  stateFilter: "",
  dateFilter: "",
  attachmentFilter: "",
  page: "1",
};
const selectClass = "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-8 pl-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function normalizeRequestType(type) {
  return type === "tardanza" || type === "salida_anticipada" ? type : "falta";
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function permissionDates(item) {
  return (item.fechas || []).map((row) => row.fecha).filter(Boolean);
}

function formatRequestDates(type, item) {
  if (type === "permiso" && permissionDates(item).length) {
    return permissionDates(item).map(formatDate).join(" · ");
  }
  const startDate = item.fecha_inicio || item.fecha;
  const endDate = item.fecha_fin || item.fecha;
  return `${formatDate(startDate)}${endDate !== startDate ? ` — ${formatDate(endDate)}` : ""}`;
}

function requestIncludesDate(item, dateFilter) {
  if (!dateFilter) return true;
  const dates = permissionDates(item);
  return dates.length ? dates.includes(dateFilter) : (item.fecha || item.fecha_inicio) === dateFilter;
}
function formatMinutes(value = 0) {
  const minutes = Number(value) || 0;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
const rules = [
  ["minutos_antes_inicio", "Inicio anticipado", "Cuántos minutos antes puede marcar entrada."],
  ["tolerancia_tardanza", "Tolerancia de tardanza", "Margen antes de registrar una tardanza."],
  ["umbral_salida_anticipada", "Salida anticipada", "Minutos que activan la solicitud de justificación."],
  ["minutos_gracia_falta", "Gracia para falta", "Espera antes de marcar una jornada como falta."],
  ["recordatorio_inicio", "Recordatorio de entrada", "Anticipación del aviso para iniciar jornada."],
  ["recordatorio_salida", "Recordatorio de salida", "Anticipación del aviso para finalizar jornada."],
  ["max_minutos_offline", "Máximo sin conexión", "Tiempo permitido para sincronizar una marcación offline."],
];

export default function AttendanceWorkflowAdmin({ mode = "settings" }) {
  const isRequestHistory = mode === "request-history";
  const { profile } = useAuth();
  const canManage = hasPermission(profile, PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES);
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: requestParamMap,
    defaults: requestFilterDefaults,
  });
  const filters = readInitialFilters();
  const {
    search,
    areaFilter,
    typeFilter,
    stateFilter,
    dateFilter,
    attachmentFilter,
  } = filters;
  const page = Math.max(1, Number.parseInt(filters.page, 10) || 1);
  const [data, setData] = useState({ permisos: [], apelaciones: [], justificaciones: [], configuracion: {}, dias_no_laborables: [] });
  const [settings, setSettings] = useState({});
  const [review, setReview] = useState(null);
  const [observation, setObservation] = useState("");
  const [warningSeverity, setWarningSeverity] = useState("media");
  const [activeRequestType, setActiveRequestType] = useState("falta");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const section = mode === "settings" ? "configuracion" : isRequestHistory ? "historial" : "solicitudes";
      const result = await getFlujosAsistencia(section);
      setData(result);
      setSettings({ jornada_hora_inicio: "08:00", jornada_hora_fin: "18:00", jornada_dias: [1, 2, 3, 4, 5, 6], ...(result.configuracion || {}) });
    } catch (error) { setFeedback({ type: "error", message: error?.message || "No se pudo cargar la administración de asistencia." }); }
    finally { setLoading(false); }
  }, [isRequestHistory, mode]);
  useEffect(() => { void load(); }, [load]);

  async function run(work, message) {
    setBusy(true);
    try { await work(); setFeedback({ type: "success", message }); await load(); return true; }
    catch (error) { setFeedback({ type: "error", message: error?.message || "No se pudo completar la operación." }); return false; }
    finally { setBusy(false); }
  }
  async function resolve() {
    if (!review) return;
    const ok = await run(
      () => review.type === "permiso"
        ? resolverPermiso(review.item.id, review.decision, observation.trim())
        : resolverJustificacion(
          review.item.id,
          review.decision,
          observation.trim(),
          review.decision === "rechazada" ? warningSeverity : null,
        ),
      "Solicitud resuelta correctamente.",
    );
    if (ok) { setReview(null); setObservation(""); setWarningSeverity("media"); }
  }

  const allRequests = useMemo(() => [
    ...(data.justificaciones || []).map((item) => ({
      type: normalizeRequestType(item.tipo),
      item,
    })),
    ...(data.permisos || []).map((item) => ({ type: "permiso", item })),
  ], [data]);
  const areas = useMemo(
    () => [...new Set(allRequests.map(({ item }) => item.area).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second, "es")),
    [allRequests],
  );
  const requests = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-PE");
    return allRequests.filter(({ type, item }) =>
      (isRequestHistory ? item.estado === "aprobada" || item.estado === "rechazada" : item.estado === "pendiente")
      && (!isRequestHistory || !stateFilter || item.estado === stateFilter)
      && (mode === "requests" ? type === activeRequestType : (!typeFilter || type === typeFilter))
      && (!areaFilter || item.area === areaFilter)
      && requestIncludesDate(item, dateFilter)
      && (isRequestHistory || !attachmentFilter || (attachmentFilter === "con_archivo" ? Boolean(item.adjunto_url) : !item.adjunto_url))
      && (!term || `${item.integrante || ""} ${item.correo || ""}`.toLocaleLowerCase("es-PE").includes(term))
    );
  }, [activeRequestType, allRequests, areaFilter, attachmentFilter, dateFilter, isRequestHistory, mode, search, stateFilter, typeFilter]);
  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRequests = requests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = Boolean(search || typeFilter || (isRequestHistory && stateFilter) || areaFilter || dateFilter || (!isRequestHistory && attachmentFilter));
  function updateFilter(key, value) {
    writeFiltersToUrl({ ...filters, [key]: value, page: "1" });
  }
  function clearFilters() {
    writeFiltersToUrl(requestFilterDefaults);
  }
  function saveSettings() { return guardarConfiguracionAsistencia({ ...Object.fromEntries(rules.map(([key]) => [key, Number(settings[key])])), jornada_hora_inicio: String(settings.jornada_hora_inicio).slice(0, 5), jornada_hora_fin: String(settings.jornada_hora_fin).slice(0, 5), jornada_dias: (settings.jornada_dias || []).map(Number) }); }

  if (mode === "requests") {
    const activeView = REQUEST_VIEWS.find((view) => view.id === activeRequestType) || REQUEST_VIEWS[0];
    const EmptyIcon = activeView.icon;
    const categorizedRequests = allRequests.filter(({ type, item }) => type === activeRequestType && item.estado === "pendiente");

    return <div className="space-y-5">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#244B34] via-[#2D5A3D] to-[#39724D] p-5 text-white sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15"><FileCheck2 className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-100 uppercase">Gestión institucional</p>
              <h1 className="mt-1 text-xl font-extrabold">Solicitudes de asistencia</h1>
              <p className="mt-1 max-w-2xl text-sm text-emerald-50/80">Revisa las faltas, tardanzas, salidas anticipadas y permisos dentro de tu alcance.</p>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <div role="tablist" aria-label="Tipos de solicitudes" className="mb-5 grid min-w-full grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 lg:grid-cols-4">
            {REQUEST_VIEWS.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeRequestType === id} onClick={() => setActiveRequestType(id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ${activeRequestType === id ? "bg-white text-[#2D5A3D] shadow-sm" : "text-slate-500 hover:bg-white/70"}`}><Icon className="h-4 w-4" />{label}</button>)}
          </div>

          {loading ? <div className="py-12 text-center text-sm text-slate-500">Cargando solicitudes...</div> : !categorizedRequests.length ? <div className="mx-auto my-8 max-w-lg rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center"><EmptyIcon className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-bold text-slate-800">{activeView.empty}</p></div> : <div className="grid gap-4 xl:grid-cols-2">
            {categorizedRequests.map(({ type, item }) => {
              const recoveries = item.recuperaciones || [];
              const missingMinutes = type === "permiso"
                ? item.minutos_a_recuperar
                : recoveries.reduce((total, recovery) => total + Number(recovery.minutos || 0), 0);
              return <article key={`${type}-${item.id}`} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="absolute inset-y-0 left-0 w-1 bg-amber-400" />
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <AttendanceMemberCell name={item.integrante} email={item.correo} avatarPath={item.avatar_path} avatarUrl={item.avatar_url} detail={`${item.cargo || "Sin cargo"} · ${item.area || "Sin área"}`} />
                    <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${typeStyles[type]}`}>{filterTypeLabels[type]}</span>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Fecha</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatRequestDates(type, item)}</p></div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase">Por recuperar</p><p className="mt-1 text-sm font-semibold text-slate-700">{formatMinutes(missingMinutes)}</p></div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.motivo || "Sin motivo registrado."}</p>
                  {item.adjunto_url ? <a href={item.adjunto_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 underline"><Paperclip className="h-3.5 w-3.5" />Ver adjunto</a> : null}
                  {recoveries.length ? <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-bold text-slate-800">Plan de recuperación</p><div className="mt-2 flex flex-wrap gap-2">{recoveries.map((recovery) => <span key={recovery.id || `${recovery.fecha}-${recovery.hora_inicio}`} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-600">{formatDate(recovery.fecha)} · {String(recovery.hora_inicio).slice(0, 5)}–{String(recovery.hora_fin).slice(0, 5)}</span>)}</div></div> : null}
                  <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    {canManage ? <><Button type="button" size="sm" variant="outline" onClick={() => setReview({ type, item, decision: "aprobada" })} disabled={busy} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><CheckCircle2 className="h-3.5 w-3.5" />Aprobar</Button><Button type="button" size="sm" variant="outline" onClick={() => setReview({ type, item, decision: "rechazada" })} disabled={busy} className="border-rose-200 text-rose-700 hover:bg-rose-50"><XCircle className="h-3.5 w-3.5" />Denegar</Button></> : <span className="text-xs text-slate-400">Solo lectura</span>}
                  </div>
                </div>
              </article>;
            })}
          </div>}
        </div>
      </section>

      <Dialog open={Boolean(review)} onOpenChange={(open) => { if (!open && !busy) { setReview(null); setObservation(""); setWarningSeverity("media"); } }}>
        <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-[520px]">
          <DialogHeader><DialogTitle>{review?.decision === "aprobada" ? "Aprobar solicitud" : "Denegar solicitud"}</DialogTitle><DialogDescription>{review ? `${typeLabels[review.type]} de ${review.item.integrante || "integrante"}.` : ""}</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            {review?.decision === "rechazada" && review?.type !== "permiso" ? <label className="block text-xs font-bold text-slate-700">Gravedad de la amonestación<select value={warningSeverity} onChange={(event) => setWarningSeverity(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-slate-200 px-3"><option value="leve">Leve</option><option value="media">Media</option><option value="grave">Grave</option></select></label> : null}
            <label className="block text-xs font-bold text-slate-700">Observación<textarea value={observation} onChange={(event) => setObservation(event.target.value)} rows={4} maxLength={1000} className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm" placeholder="Añade una respuesta para el integrante..." /></label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReview(null)} disabled={busy}>Cancelar</Button>
            <ActionButton
              action="confirm"
              tone={review?.decision === "aprobada" ? "primary" : "danger"}
              type="button"
              onClick={() => void resolve()}
              loading={busy}
              loadingText="Guardando..."
            >
              Confirmar
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
  }

  if (mode === "requests" || isRequestHistory) return <div className="space-y-4">
    <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

    <section className="module-section-enter module-enter-delay-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)]">
          <label className="relative md:col-span-2 lg:col-span-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input value={search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Buscar por nombre o correo..." aria-label="Buscar por nombre o correo" className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={areaFilter} onChange={(event) => updateFilter("areaFilter", event.target.value)} className={selectClass} aria-label="Filtrar por área">
              <option value="">Selecciona un área</option>
              {areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={typeFilter} onChange={(event) => updateFilter("typeFilter", event.target.value)} className={selectClass} aria-label="Filtrar por tipo de solicitud">
              <option value="">Selecciona un tipo</option>
              {requestTypes.map((type) => <option key={type} value={type}>{filterTypeLabels[type]}</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(200px,1fr)_auto]">
          {isRequestHistory ? <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={stateFilter} onChange={(event) => updateFilter("stateFilter", event.target.value)} className={selectClass} aria-label="Filtrar por estado">
              <option value="">Selecciona un estado</option><option value="aprobada">Aprobadas</option><option value="rechazada">Denegadas</option>
            </select>
          </label> : <label className="relative">
            <Paperclip className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <select value={attachmentFilter} onChange={(event) => updateFilter("attachmentFilter", event.target.value)} className={selectClass} aria-label="Filtrar por archivo adjunto">
              <option value="">Selecciona archivo adjunto</option><option value="con_archivo">Con archivo adjunto</option><option value="sin_archivo">Sin archivo adjunto</option>
            </select>
          </label>}
          <label className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input type="date" value={dateFilter} onChange={(event) => updateFilter("dateFilter", event.target.value)} aria-label="Filtrar por fecha" className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
          </label>
          <Button type="button" variant="outline" onClick={clearFilters} disabled={!hasFilters} className={`h-10 gap-2 rounded-xl ${hasFilters ? "border-red-200 text-red-600 hover:bg-red-50 hover:text-red-600" : "bg-slate-50 text-slate-300"}`}>
            <X className="h-4 w-4" />Limpiar filtros
          </Button>
        </div>
      </div>
    </section>

    <section className="module-section-enter module-enter-delay-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table
          className="w-full min-w-[980px] table-fixed border-collapse"
          loading={loading}
          loadingLabel="Cargando solicitudes..."
        >
          <thead><tr className="bg-slate-50/70">
            <th className="w-[23%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Integrante</th>
            <th className="w-[17%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Tipo</th>
            <th className="w-[14%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Fecha y horario</th>
            <th className="w-[22%] px-4 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Motivo</th>
            <th className="w-[14%] px-4 py-3.5 text-right text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">{isRequestHistory ? "Estado" : "Acciones"}</th>
          </tr></thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, index) => <tr key={index} className="border-t border-slate-100"><td colSpan={5} className="px-5 py-3"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /></td></tr>) : visibleRequests.map(({ type, item }, index) => {
              const key = String(item.id);
              const stateClass = item.estado === "pendiente" ? "bg-amber-50 text-amber-700" : item.estado === "aprobada" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";
              return <tr
                key={key}
                className="module-row-enter border-t border-slate-100 align-top hover:bg-slate-50/50"
                style={{ animationDelay: `${180 + index * 45}ms` }}
              >
                <td className="px-4 py-4"><AttendanceMemberCell name={item.integrante} email={item.correo} avatarPath={item.avatar_path} avatarUrl={item.avatar_url} detail={`${item.cargo || "Sin cargo"} · ${item.area || "Sin área"}`} /></td>
                <td className="px-4 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase ${typeStyles[type]}`}>{typeLabels[type]}</span></td>
                <td className="px-4 py-4"><p className="max-w-56 text-xs font-semibold text-slate-700">{formatRequestDates(type, item)}</p>{type !== "permiso" ? <p className="mt-1 text-[10px] text-slate-400">{`${String(item.hora_inicio_programada || "").slice(0, 5)} - ${String(item.hora_fin_programada || "").slice(0, 5)}`}</p> : null}</td>
                <td className="px-4 py-4"><p className="line-clamp-2 text-xs leading-5 text-slate-600">{item.motivo || "Sin motivo registrado."}</p>{item.adjunto_url ? <a href={item.adjunto_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[11px] font-bold text-blue-700 underline">Ver adjunto</a> : null}</td>
                {isRequestHistory ? <td className="px-4 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${stateClass}`}>{item.estado === "rechazada" ? "denegada" : item.estado}</span>{item.amonestacion_gravedad ? <p className="mt-2 text-[10px] text-rose-600">Gravedad: {item.amonestacion_gravedad}</p> : null}</td> : <td className="px-4 py-4"><div className="flex justify-end gap-2">{item.estado === "pendiente" && canManage ? <><Button type="button" size="sm" variant="outline" onClick={() => setReview({ type, item, decision: "aprobada" })} disabled={busy} className="h-8 gap-1.5 rounded-lg border-emerald-200 bg-white px-2.5 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" />Aprobar</Button><Button type="button" size="sm" variant="outline" onClick={() => setReview({ type, item, decision: "rechazada" })} disabled={busy} className="h-8 gap-1.5 rounded-lg border-rose-200 px-2.5 text-[11px] text-rose-700 hover:bg-rose-50 hover:text-rose-800"><XCircle className="h-3.5 w-3.5" />Denegar</Button></> : <span className="text-[10px] text-slate-400">Solo lectura</span>}</div></td>}
              </tr>;
            })}
            {!loading && !requests.length ? <tr><td colSpan={5} className="px-6 py-14 text-center"><ClipboardCheck className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">{hasFilters ? "No hay resultados para estos filtros" : isRequestHistory ? "No hay solicitudes en el historial" : "No hay solicitudes pendientes"}</p><p className="mt-1 text-xs text-slate-400">{hasFilters ? "Intenta modificar o limpiar los filtros aplicados." : isRequestHistory ? "Las solicitudes aprobadas o denegadas aparecerán aquí." : "Las nuevas justificaciones de faltas, tardanzas y salidas anticipadas aparecerán aquí."}</p>{hasFilters ? <button type="button" onClick={clearFilters} className="mt-3 text-xs font-bold text-emerald-700">Limpiar filtros</button> : null}</td></tr> : null}
          </tbody>
        </Table>
      </div>
      {!loading && requests.length ? <TablePagination currentPage={currentPage} totalPages={totalPages} totalItems={requests.length} pageSize={PAGE_SIZE} startRow={(currentPage - 1) * PAGE_SIZE + 1} endRow={Math.min(currentPage * PAGE_SIZE, requests.length)} itemLabel="solicitudes" onPrevious={() => writeFiltersToUrl({ ...filters, page: String(Math.max(1, currentPage - 1)) })} onNext={() => writeFiltersToUrl({ ...filters, page: String(Math.min(totalPages, currentPage + 1)) })} /> : null}
    </section>

    <Dialog
      open={Boolean(review)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setReview(null);
          setObservation("");
          setWarningSeverity("media");
        }
      }}
    >
      <DialogContent className="w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[540px]">
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5 text-left">
          <div className="flex items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${review?.decision === "aprobada" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {review?.decision === "aprobada" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            </span>
            <div>
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {review?.decision === "aprobada" ? "Aprobar solicitud" : "Denegar solicitud"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {review ? `${typeLabels[review.type]} de ${review.item.integrante || "integrante"}.` : ""}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          {review?.decision === "rechazada" ? (
            <label className="block text-xs font-bold text-slate-700">
              Gravedad de la amonestación
              <select
                value={warningSeverity}
                onChange={(event) => setWarningSeverity(event.target.value)}
                className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="grave">Grave</option>
              </select>
            </label>
          ) : null}

          <label className="block text-xs font-bold text-slate-700">
            {review?.decision === "aprobada" ? "Observación adicional (opcional)" : "Motivo de la denegación"}
            <textarea
              value={observation}
              onChange={(event) => setObservation(event.target.value)}
              rows={4}
              placeholder={review?.decision === "aprobada" ? "Puedes confirmar sin agregar una observación." : "Explica por qué se deniega esta solicitud."}
              className={`mt-2 w-full resize-none rounded-xl border bg-white p-3 text-sm text-slate-700 outline-none ${review?.decision === "aprobada" ? "border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" : "border-rose-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10"}`}
            />
            {review?.decision === "rechazada" ? <span className="mt-1.5 block text-[10px] font-normal text-slate-400">Escribe al menos 5 caracteres.</span> : null}
          </label>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => { setReview(null); setObservation(""); setWarningSeverity("media"); }} className="rounded-xl">
            Cancelar
          </Button>
          <ActionButton
            action="confirm"
            tone={review?.decision === "rechazada" ? "danger" : "primary"}
            type="button"
            loading={busy}
            loadingText="Procesando..."
            disabled={review?.decision === "rechazada" && observation.trim().length < 5}
            onClick={resolve}
          >
            {review?.decision === "aprobada" ? "Confirmar aprobación" : "Confirmar denegación"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;

  return (
    <div className="space-y-5">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] sm:p-6">
        <div className="flex items-start gap-3 border-b border-slate-100 pb-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Settings2 className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900">Configuración de asistencia</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Define los márgenes y tiempos utilizados para controlar la asistencia.</p>
          </div>
        </div>

        <form
          className="pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void run(saveSettings, "Configuración actualizada.");
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rules.map(([key, label, description]) => (
              <label key={key} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition-colors focus-within:border-emerald-300 focus-within:bg-white">
                <span className="block text-xs font-semibold text-slate-700">{label}</span>
                <span className="mt-1 block min-h-10 text-[11px] font-normal leading-5 text-slate-400">{description}</span>
                <span className="relative mt-3 block">
                  <Input
                    type="number"
                    min="0"
                    value={settings[key] ?? ""}
                    onChange={(event) => setSettings((value) => ({ ...value, [key]: event.target.value }))}
                    className="h-11 rounded-xl border-slate-200 bg-white pr-12 text-sm shadow-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] font-medium text-slate-400">min</span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <ActionButton action="save" type="submit" loading={busy} loadingText="Guardando...">
              Guardar configuración
            </ActionButton>
          </div>
        </form>
      </section>

    </div>
  );
}
