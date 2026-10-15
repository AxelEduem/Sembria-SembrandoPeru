/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Paperclip,
  Plus,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { getMisFlujosAsistencia } from "@/services/asistencia/asistenciaService";

const PERMISSION_VIEWS = [
  { id: "pendiente", label: "Pendientes", icon: Clock3, empty: "No tienes permisos pendientes" },
  { id: "aprobada", label: "Aprobadas", icon: CheckCircle2, empty: "No tienes permisos aprobados" },
  { id: "rechazada", label: "Rechazadas", icon: XCircle, empty: "No tienes permisos rechazados" },
];
const STATUS_STYLES = {
  pendiente: {
    label: "Pendiente",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    accent: "bg-amber-400",
  },
  aprobada: {
    label: "Aprobada",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
  },
  rechazada: {
    label: "Rechazada",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    accent: "bg-rose-500",
  },
};
const TYPE_LABELS = {
  personal: "Personal",
  medico: "Médico",
  vacaciones: "Vacaciones",
  licencia: "Licencia",
  falta: "Falta",
  tardanza: "Tardanza",
  salida_anticipada: "Salida anticipada",
};

function formatMinutes(minutes = 0) {
  const value = Number(minutes) || 0;
  return `${Math.floor(value / 60)} h ${value % 60} min`;
}
function formatDate(value) {
  if (!value) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00Z`));
}
function formatPermissionDates(item) {
  const dates = (item.fechas || []).map((row) => row.fecha).filter(Boolean);
  return dates.length
    ? dates.map(formatDate).join(" · ")
    : `${formatDate(item.fecha_inicio)} — ${formatDate(item.fecha_fin)}`;
}

export default function AsistenciaSolicitudes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [activeView, setActiveView] = useState("pendiente");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(location.state?.feedback || "");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const flows = await getMisFlujosAsistencia();
      setPermissions([
        ...(flows.permisos || []).map((item) => ({ ...item, request_kind: "permiso" })),
        ...(flows.justificaciones || []).map((item) => ({
          ...item,
          request_kind: item.tipo,
          fecha_inicio: item.asistencia?.fecha,
          fecha_fin: item.asistencia?.fecha,
          minutos_a_recuperar: (item.recuperaciones || []).reduce(
            (total, recovery) => total + Number(recovery.minutos || 0),
            0,
          ),
        })),
      ]);
    } catch (cause) {
      setError(cause?.message || "No se pudieron cargar tus solicitudes de asistencia.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (location.state?.feedback) navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const visiblePermissions = useMemo(
    () => permissions.filter((item) => item.estado === activeView),
    [permissions, activeView],
  );
  const view = PERMISSION_VIEWS.find((item) => item.id === activeView) || PERMISSION_VIEWS[0];
  const EmptyIcon = view.icon;

  return (
    <div className="module-page-enter space-y-5 pb-10">
      <Button asChild variant="ghost" className="w-fit gap-2 rounded-xl px-2 text-slate-600">
        <Link to="/asistencia">
          <ArrowLeft className="h-4 w-4" />
          Volver a mi asistencia
        </Link>
      </Button>
      <FeedbackToast
        feedback={
          error
            ? { type: "error", message: error }
            : feedback
              ? { type: "success", message: feedback }
              : null
        }
        onClose={() => {
          setError("");
          setFeedback("");
        }}
      />

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#244B34] via-[#2D5A3D] to-[#39724D] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <FileCheck2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-100 uppercase">
                  Gestión personal
                </p>
                <h1 className="mt-1 text-xl font-extrabold">Solicitudes de asistencia</h1>
                <p className="mt-1 max-w-2xl text-sm text-emerald-50/80">
                  Consulta si tus solicitudes continúan pendientes, fueron aprobadas o rechazadas.
                </p>
              </div>
            </div>
            <Button
              asChild
              className="h-11 shrink-0 gap-2 rounded-xl bg-white px-5 font-bold text-[#244B34] hover:bg-emerald-50"
            >
              <Link to="/asistencia/solicitudes/nueva">
                <Plus className="h-4 w-4" />
                Solicitar permiso
              </Link>
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div
            role="tablist"
            aria-label="Estados de solicitudes"
            className="mb-5 inline-flex min-w-full gap-1 rounded-2xl bg-slate-100 p-1"
          >
            {PERMISSION_VIEWS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeView === id}
                onClick={() => setActiveView(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeView === id ? "bg-white text-[#2D5A3D] shadow-sm" : "text-slate-500 hover:bg-white/70"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Cargando solicitudes...</div>
          ) : !visiblePermissions.length ? (
            <div className="mx-auto my-8 max-w-lg rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-7 text-center">
              <EmptyIcon className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-3 font-bold text-slate-800">{view.empty}</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {visiblePermissions.map((item) => {
                const status = STATUS_STYLES[item.estado] || STATUS_STYLES.pendiente;
                return (
                  <article
                    key={`${item.request_kind}-${item.id}`}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 ${status.accent}`} />
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            {item.request_kind === "permiso" ? "Permiso" : "Solicitud"} {TYPE_LABELS[item.tipo] || item.tipo}
                          </p>
                          <h2 className="mt-1 font-bold text-slate-900">
                            {item.request_kind === "permiso"
                              ? formatPermissionDates(item)
                              : formatDate(item.fecha_inicio)}
                          </h2>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Por recuperar
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatMinutes(item.minutos_a_recuperar)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Solicitud
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6 text-slate-600">{item.motivo}</p>
                      {item.adjunto_url ? (
                        <a
                          href={item.adjunto_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 underline"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                          Ver adjunto
                        </a>
                      ) : null}
                      {item.observacion ? (
                        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                          <strong className="text-slate-700">Respuesta:</strong> {item.observacion}
                        </div>
                      ) : null}
                      {item.recuperaciones?.length ? (
                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                          <p className="text-xs font-bold text-slate-800">Plan de recuperación</p>
                          {item.recuperaciones.map((recovery) => (
                            <div
                              key={recovery.id}
                              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                            >
                              <p className="text-sm font-semibold text-slate-800">
                                {formatDate(recovery.fecha)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {String(recovery.hora_inicio).slice(0, 5)}–
                                {String(recovery.hora_fin).slice(0, 5)} ·{" "}
                                {formatMinutes(recovery.minutos)}
                              </p>
                              <p className="mt-2 text-[11px] font-semibold text-slate-500">
                                Estado: {item.estado === "pendiente"
                                  ? "Propuesta"
                                  : item.estado === "rechazada" || recovery.estado === "cancelada"
                                    ? "Cancelada"
                                    : recovery.estado === "en_curso"
                                      ? "En curso"
                                      : recovery.estado === "completada"
                                        ? "Completada"
                                        : "Programada"}
                              </p>
                              {item.estado === "aprobada" && recovery.estado === "programada" ? (
                                <p className="mt-2 text-[11px] leading-4 text-slate-400">
                                  Este bloque aparecerá en Mi asistencia en la fecha programada.
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
