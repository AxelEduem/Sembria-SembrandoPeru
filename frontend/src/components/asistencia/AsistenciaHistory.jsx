import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  History,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import TablePagination from "@/components/ui/TablePagination";

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = String(value).split("-").map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  }).format(new Date(year, month - 1, day, 12));
}

function duration(value = 0) {
  const minutes = Math.max(0, Number(value) || 0);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const STATE = {
  completada: {
    label: "Completada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  en_jornada: {
    label: "En jornada",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  jornada_abierta: {
    label: "Abierta",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  falta: {
    label: "Falta",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  justificada: {
    label: "Justificada",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
  permiso: {
    label: "Permiso",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
  },
};

function HistorySkeleton() {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="asistencia-skeleton h-3 w-24 rounded" />
        <div className="asistencia-skeleton mt-2 h-5 w-48 rounded" />
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="px-5 py-4">
            <div className="flex gap-3">
              <div className="asistencia-skeleton h-10 w-10 rounded-xl" />

              <div className="min-w-0 flex-1">
                <div className="asistencia-skeleton h-3 w-40 rounded" />
                <div className="asistencia-skeleton mt-2 h-3 w-56 rounded" />
              </div>

              <div className="asistencia-skeleton h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AsistenciaHistory({
  emptyMessage = "Tus jornadas registradas aparecerán aquí.",
  emptyTitle = "Aún no hay historial.",
  history = [],
  loading = false,
  pagination = null,
  totalItems = history.length,
}) {
  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
            Seguimiento
          </p>

          <h2 className="mt-1 flex items-center gap-2 text-base font-bold text-slate-900">
            <History className="h-4 w-4 text-emerald-700" />
            Historial reciente
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Consulta el resultado de tus bloques anteriores.
          </p>
        </div>

        <Badge
          variant="outline"
          className="rounded-full border-slate-200 bg-slate-50 text-[10px] text-slate-600"
        >
          {totalItems} registros
        </Badge>
      </div>

      {history.length ? (
        <div className="divide-y divide-slate-100">
          {history.map((item, index) => {
            const state = STATE[item.estado] || {
              label: String(item.estado || "Pendiente").replaceAll("_", " "),
              className: "border-slate-200 bg-slate-50 text-slate-600",
            };

            const late = Number(item.minutos_tardanza) || 0;
            const early = Number(item.minutos_salida_anticipada) || 0;

            return (
              <article
                key={item.id}
                className="asistencia-card-enter group px-5 py-4 transition-colors duration-200 hover:bg-slate-50/70 sm:px-6"
                style={{
                  animationDelay: `${index * 55}ms`,
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(item.fecha)}
                        </p>

                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />

                        <p className="text-sm font-semibold text-slate-700">
                          {String(item.hora_inicio_programada).slice(0, 5)}
                          {" – "}
                          {String(item.hora_fin_programada).slice(0, 5)}
                        </p>

                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${state.className}`}
                        >
                          {state.label}
                        </Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>
                          {item.hora_entrada
                            ? `Entrada ${new Intl.DateTimeFormat("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Lima",
                              }).format(new Date(item.hora_entrada))}`
                            : "Sin entrada"}
                        </span>

                        <span>
                          {item.hora_salida
                            ? `Salida ${new Intl.DateTimeFormat("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Lima",
                              }).format(new Date(item.hora_salida))}`
                            : "Sin salida"}
                        </span>
                      </div>

                      {(late > 0 || early > 0) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {late > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <ArrowUpRight className="h-3 w-3" />
                              +{late}m tardanza
                            </span>
                          )}

                          {early > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <ArrowDownRight className="h-3 w-3" />
                              {early}m anticipados
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Realizado
                      </p>

                      <p className="mt-0.5 text-sm font-bold text-slate-800">
                        {duration(item.minutos_realizados)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Programado
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-700">
                        {duration(item.minutos_programados)}
                      </p>
                    </div>
                  </div>
                </div>

                {(item.descripcion_jornada || (item.asistencia_incidencias || []).length || (item.asistencia_justificaciones || []).length || (item.asistencia_amonestaciones || []).length) ? (
                  <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Trabajo realizado</p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">{item.descripcion_jornada || "Sin descripción registrada."}</p>
                    </div>
                    <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Incidencias y revisión</p>
                      {(item.asistencia_incidencias || []).map((incident) => (
                        <p key={incident.id} className="text-xs text-slate-600"><strong>{String(incident.tipo).replaceAll("_", " ")}:</strong> {incident.descripcion || `${incident.minutos} minutos`}</p>
                      ))}
                      {(item.asistencia_justificaciones || []).map((justification) => (
                        <p key={justification.id} className="text-xs text-slate-600"><strong>Justificación ({justification.estado}):</strong> {justification.motivo}{justification.observacion ? ` — ${justification.observacion}` : ""}</p>
                      ))}
                      {(item.asistencia_amonestaciones || []).map((warning) => (
                        <p key={warning.id} className="text-xs font-semibold text-rose-700"><strong>Amonestación:</strong> {warning.motivo}</p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
          {pagination ? (
            <TablePagination
              currentPage={pagination.currentPage}
              endRow={pagination.endRow}
              itemLabel="registros"
              onNext={pagination.onNext}
              onPrevious={pagination.onPrevious}
              startRow={pagination.startRow}
              totalItems={totalItems}
              totalPages={pagination.totalPages}
            />
          ) : null}
        </div>
      ) : (
        <div className="px-5 py-14 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <History className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">{emptyTitle}</p>

          <p className="mt-1 text-xs text-slate-500">
            {emptyMessage}
          </p>
        </div>
      )}
    </section>
  );
}
