import {
  CalendarDays,
  ClipboardCheck,
  Filter,
  History,
  Search,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TablePagination from "@/components/ui/TablePagination";

function duration(value = 0) {
  const minutes = Math.max(0, Number(value) || 0);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (!hours) return `${mins}m`;
  if (!mins) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

const STATE = {
  pendiente: "border-slate-200 bg-slate-50 text-slate-600",
  en_jornada: "border-blue-200 bg-blue-50 text-blue-700",
  completada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  jornada_abierta: "border-amber-200 bg-amber-50 text-amber-700",
  falta: "border-rose-200 bg-rose-50 text-rose-700",
  justificada: "border-violet-200 bg-violet-50 text-violet-700",
};

function AdminRowSkeleton() {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="asistencia-skeleton h-10 w-10 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="asistencia-skeleton h-3 w-40 rounded" />
          <div className="asistencia-skeleton mt-2 h-3 w-60 rounded" />
        </div>
        <div className="asistencia-skeleton h-7 w-24 rounded-full" />
      </div>
    </div>
  );
}

function AuditPanel({ row, audit, onClose }) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            Trazabilidad
          </p>

          <h4 className="mt-1 text-sm font-bold text-slate-900">
            Auditoría · asistencia #{row.id}
          </h4>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 rounded-lg"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Cerrar
        </Button>
      </div>

      {audit.length ? (
        <div className="space-y-2">
          {audit.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-[9px] font-semibold text-emerald-700"
                >
                  {String(item.accion || "").replaceAll("_", " ")}
                </Badge>

                <span className="text-[10px] text-slate-400">
                  {item.created_at
                    ? new Intl.DateTimeFormat("es-PE", {
                        dateStyle: "short",
                        timeStyle: "short",
                        timeZone: "America/Lima",
                      }).format(new Date(item.created_at))
                    : "—"}
                </span>
              </div>

              <p className="mt-2 text-xs text-slate-600">
                {item.motivo || "Sin motivo registrado."}
              </p>

              {(item.datos_anteriores || item.datos_nuevos) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[10px] font-semibold text-emerald-700">
                    Ver cambios registrados
                  </summary>

                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-relaxed text-slate-200">
                    {JSON.stringify(
                      {
                        anteriores: item.datos_anteriores,
                        nuevos: item.datos_nuevos,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-xs text-slate-500">
          No hay movimientos de auditoría para esta asistencia.
        </p>
      )}
    </div>
  );
}

export default function AsistenciaAdmin({
  rows = [],
  loading = false,
  date,
  setDate,
  nameFilter,
  setNameFilter,
  areaFilter,
  setAreaFilter,
  areas = [],
  onProcessFaults,
  onApprove,
  onReject,
  onCorrect,
  onAudit,
  audit = [],
  auditRow,
  onCloseAudit,
  busy = false,
  currentPage = 1,
  totalPages = 1,
  startRow = 0,
  endRow = 0,
  totalItems = 0,
  onPageChange,
}) {
  return (
    <section className="asistencia-section-enter overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_4px_22px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Gestión operativa
                </p>

                <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">
                  Administración de asistencia
                </h2>
              </div>
            </div>

            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-500">
              Consulta los bloques visibles según tu alcance, revisa incidencias
              y gestiona los casos que requieren atención.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 w-42.5 rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-xs focus:bg-white"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onProcessFaults}
              className="h-10 rounded-xl border-slate-200"
            >
              <Wrench className="mr-2 h-3.5 w-3.5" />
              Procesar faltas
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <Input
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
              placeholder="Buscar integrante..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm focus:bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="
                h-10
                w-full
                appearance-none
                rounded-xl
                border
                border-slate-200
                bg-slate-50/60
                px-9
                text-sm
                text-slate-700
                outline-none
                transition-colors
                focus:border-emerald-500
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-500/10
              "
            >
              <option value="">Todas las áreas visibles</option>

              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <AdminRowSkeleton key={index} />
          ))}
        </div>
      ) : rows.length ? (
        <>
        <div className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const person = row.integrantes?.personas;

            const name = person
              ? `${person.nombres || ""} ${person.apellidos || ""}`.trim()
              : `Integrante #${row.integrante_id}`;

            const area =
              row.integrantes_historial?.cargos?.areas?.nombre || "Sin área";

            const stateClass =
              STATE[row.estado] || STATE.pendiente;

            const pending = row.asistencia_justificaciones?.find(
              (item) => item.estado === "pendiente",
            );

            return (
              <article
                key={row.id}
                className="asistencia-card-enter px-5 py-4 transition-colors duration-200 hover:bg-slate-50/50 sm:px-6"
                style={{
                  animationDelay: `${index * 45}ms`,
                }}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                      {name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {name}
                        </p>

                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${stateClass}`}
                        >
                          {String(row.estado || "pendiente").replaceAll(
                            "_",
                            " ",
                          )}
                        </Badge>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>{area}</span>

                        <span className="text-slate-300">•</span>

                        <span>
                          {String(row.hora_inicio_programada).slice(0, 5)}
                          {" – "}
                          {String(row.hora_fin_programada).slice(0, 5)}
                        </span>

                        <span className="text-slate-300">•</span>

                        <span>
                          {duration(row.minutos_realizados)} /{" "}
                          {duration(row.minutos_programados)}
                        </span>

                        {(row.asistencia_incidencias?.length || 0) > 0 && (
                          <>
                            <span className="text-slate-300">•</span>

                            <span className="font-medium text-amber-700">
                              {row.asistencia_incidencias.length}{" "}
                              {row.asistencia_incidencias.length === 1
                                ? "incidencia"
                                : "incidencias"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                    {pending && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => onApprove(pending.id)}
                          className="h-9 rounded-xl bg-[#2D5A3D] text-xs hover:bg-[#234B32]"
                        >
                          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                          Aprobar
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => onReject(pending.id)}
                          className="h-9 rounded-xl text-xs"
                        >
                          Rechazar
                        </Button>
                      </>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onCorrect(row)}
                      className="h-9 rounded-xl text-xs"
                    >
                      Corregir
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => onAudit(row)}
                      className="h-9 rounded-xl text-xs"
                    >
                      <History className="mr-1.5 h-3.5 w-3.5" />
                      Auditoría
                    </Button>
                  </div>
                </div>

                {auditRow?.id === row.id && (
                  <AuditPanel
                    row={row}
                    audit={audit}
                    onClose={onCloseAudit}
                  />
                )}
              </article>
            );
          })}
        </div>

        <TablePagination
          currentPage={currentPage}
          endRow={endRow}
          itemLabel="registros"
          onNext={() => onPageChange?.(Math.min(currentPage + 1, totalPages))}
          onPrevious={() => onPageChange?.(Math.max(currentPage - 1, 1))}
          startRow={startRow}
          totalItems={totalItems}
          totalPages={totalPages}
        />
        </>
      ) : (
        <div className="px-5 py-16 text-center sm:px-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
            <Search className="h-5 w-5" />
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No hay asistencias para este filtro.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Prueba cambiar la fecha, búsqueda o área.
          </p>
        </div>
      )}
    </section>
  );
}