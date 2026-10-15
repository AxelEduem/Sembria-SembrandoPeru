import { useMemo, useState } from "react";

import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Mail,
  UserRound,
} from "lucide-react";

import TablePagination from "@/components/ui/TablePagination";
import CopyValueButton from "@/components/ui/CopyValueButton";
import {
  DIAS_SEMANA,
  formatHours,
} from "@/services/integrantes-horarios/integrantesHorariosService";
import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

const PAGE_SIZE = 6;

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("es-PE");
}

function getDay(day) {
  return DIAS_SEMANA.find(
    (item) => Number(item.value) === Number(day),
  );
}

function getDayShortLabel(day) {
  const item = getDay(day);

  if (!item) {
    return "-";
  }

  return item.shortLabel || item.label || "-";
}

function formatTime(value) {
  if (!value) {
    return "-";
  }

  return String(value).slice(0, 5);
}

function sortSchedules(schedules) {
  return [...schedules].sort((first, second) => {
    const firstTime = String(first.hora_inicio || "");
    const secondTime = String(second.hora_inicio || "");

    return firstTime.localeCompare(secondTime);
  });
}

function getSchedulesByDay(row) {
  const result = {};

  DIAS_SEMANA.forEach((day) => {
    result[day.value] = sortSchedules(
      (row.horarios || []).filter(
        (block) =>
          Number(block.dia_semana) ===
          Number(day.value),
      ),
    );
  });

  return result;
}

function TypeBadge({ type }) {
  const config =
    type === "practicante"
      ? {
          label: "Practicante",
          badge: "bg-blue-50 text-blue-700 ring-blue-100",
          dot: "bg-blue-500",
        }
      : type === "gerente"
        ? {
            label: "Gerente",
            badge: "bg-violet-50 text-violet-700 ring-violet-100",
            dot: "bg-violet-500",
          }
        : {
            label: "Voluntario",
            badge: "bg-amber-50 text-amber-700 ring-amber-100",
            dot: "bg-amber-500",
          };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition-transform duration-200 group-hover/card:scale-[1.02] ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function DayColumn({ day, schedules }) {
  const hasSchedules = schedules.length > 0;

  return (
    <div
      className={`group/day relative min-w-0 overflow-hidden rounded-xl border p-2.5 transition-all duration-300 ${
        hasSchedules
          ? "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_6px_16px_rgba(16,185,129,0.07)]"
          : "border-slate-100 bg-slate-50/60"
      }`}
    >
      {hasSchedules && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent opacity-0 transition-opacity duration-300 group-hover/day:opacity-100" />
      )}

      <div className="mb-2 flex items-center justify-between gap-2">
        <p
          className={`truncate text-[10px] font-bold tracking-[0.06em] uppercase transition-colors duration-200 ${
            hasSchedules
              ? "text-slate-600 group-hover/day:text-emerald-700"
              : "text-slate-300"
          }`}
        >
          {getDayShortLabel(day.value)}
        </p>
      </div>

      {hasSchedules ? (
        <div className="space-y-1.5">
          {schedules.map((block, index) => (
            <div
              key={
                block.id ||
                `${day.value}-${block.hora_inicio}-${block.hora_fin}-${index}`
              }
              className="group/time relative overflow-hidden rounded-lg border border-emerald-100/90 bg-gradient-to-br from-emerald-50 to-emerald-50/60 px-2 py-1.5 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-[0_3px_10px_rgba(16,185,129,0.08)]"
            >
              <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400 opacity-70 transition-all duration-200 group-hover/time:w-1" />

              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/80 ring-1 ring-emerald-100">
                  <Clock3
                    className="h-2.5 w-2.5 text-emerald-600"
                    strokeWidth={2}
                  />
                </div>

                <p className="truncate text-[10px] font-bold text-emerald-800">
                  {formatTime(block.hora_inicio)}{" "}
                  <span className="px-0.5 text-emerald-400">
                    —
                  </span>{" "}
                  {formatTime(block.hora_fin)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[36px] items-center justify-center">
          <span className="text-[9px] font-medium text-slate-300">
            Sin actividad
          </span>
        </div>
      )}
    </div>
  );
}

function PersonScheduleCard({ row, index }) {
  const schedulesByDay = useMemo(
    () => getSchedulesByDay(row),
    [row],
  );

  const hasSchedule = (row.horarios || []).length > 0;
  const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

  return (
    <article
      className="group/card relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.035)] opacity-0 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(15,23,42,0.08)]"
      style={{
        animation:
          "horario-card-enter 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        animationDelay: `${index * 70}ms`,
      }}
    >
      {/* Línea superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

      {/* Aura */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-emerald-100/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover/card:opacity-100" />

      {/* Cabecera */}
      <div className="relative border-b border-slate-100 px-4 py-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/60 text-xs font-bold text-emerald-700 shadow-[0_2px_6px_rgba(16,185,129,0.08)] transition-all duration-300 group-hover/card:border-emerald-200 group-hover/card:shadow-[0_4px_12px_rgba(16,185,129,0.12)]">
              {avatarUrl ? <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(row.avatar_path)} alt={`Foto de ${row.nombre}`} className="h-full w-full rounded-xl" /> : getInitials(row.nombre)}
            </div>

            <span
              className={`absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full border-2 border-white ${
                hasSchedule
                  ? "bg-emerald-500"
                  : "bg-slate-300"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800 transition-colors duration-200 group-hover/card:text-slate-900">
                  {row.nombre || "Sin nombre"}
                </p>

                <div className="mt-1 flex min-w-0 items-center gap-1.5">
                  <Mail
                    className="h-3 w-3 shrink-0 text-slate-400"
                    strokeWidth={1.8}
                  />

                  <p className="truncate text-[11px] text-slate-500">
                    {row.correo || "Sin correo"}
                  </p>

                  <CopyValueButton value={row.correo} label="correo" />
                </div>
              </div>

              {/* Horas */}
              <div className="shrink-0 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-right transition-colors duration-200 group-hover/card:border-emerald-100 group-hover/card:bg-emerald-50/40">
                <p className="text-[8px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                  Horas
                </p>

                <p className="mt-0.5 text-sm font-bold text-slate-800">
                  {formatHours(row.total_horas || 0)}
                </p>
              </div>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <TypeBadge type={row.tipo_integrante} />

              {row.area && (
                <span className="max-w-[180px] truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200/70 transition-colors duration-200 group-hover/card:bg-slate-50">
                  {row.area}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cargo */}
        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-2.5 py-2 transition-colors duration-200 group-hover/card:border-slate-200 group-hover/card:bg-slate-50">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
            <UserRound
              className="h-3.5 w-3.5 text-slate-400"
              strokeWidth={1.8}
            />
          </div>

          <div className="min-w-0">
            <p className="text-[8px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Cargo
            </p>

            <p className="truncate text-xs font-semibold text-slate-600">
              {row.cargo || "Sin cargo"}
            </p>
          </div>
        </div>
      </div>

      {/* Horario semanal */}
      <div className="relative px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Horario semanal
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              Distribución de horarios por día
            </p>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${
              hasSchedule
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-slate-100 text-slate-500 ring-slate-200"
            }`}
          >
            {hasSchedule ? (
              <CheckCircle2
                className="h-3 w-3"
                strokeWidth={1.9}
              />
            ) : (
              <Clock3
                className="h-3 w-3"
                strokeWidth={1.9}
              />
            )}

            {hasSchedule
              ? "Programado"
              : "Sin horario"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DIAS_SEMANA.map((day) => (
            <DayColumn
              key={day.value}
              day={day}
              schedules={
                schedulesByDay[day.value] || []
              }
            />
          ))}
        </div>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-4 py-2">
        <span className="text-[9px] font-medium text-slate-400">
          Programación semanal
        </span>
      </div>
    </article>
  );
}

function EmptyState({ emptyMessage }) {
  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <CalendarClock
            className="h-6 w-6 text-slate-400"
            strokeWidth={1.7}
          />
        </div>

        <p className="text-sm font-semibold text-slate-700">
          {emptyMessage}
        </p>

        <p className="mt-1 max-w-md text-xs leading-5 text-slate-400">
          Prueba modificando alguno de los filtros
          para encontrar personas con horarios
          registrados.
        </p>
      </div>

      <TablePagination
        currentPage={1}
        endRow={0}
        itemLabel="personas"
        onNext={() => {}}
        onPrevious={() => {}}
        pageSize={PAGE_SIZE}
        startRow={0}
        totalItems={0}
        totalPages={1}
      />
    </section>
  );
}

function HorarioTable({
  emptyMessage,
  horarios,
}) {
  const rowsKey = horarios.map((row) => row.id).join("|");
  const [pagination, setPagination] = useState({ rowsKey, currentPage: 1 });
  const currentPage = pagination.rowsKey === rowsKey ? pagination.currentPage : 1;

  const totalPages = Math.max(
    1,
    Math.ceil(horarios.length / PAGE_SIZE),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const paginatedHorarios = useMemo(() => {
    const startIndex =
      (safeCurrentPage - 1) * PAGE_SIZE;

    return horarios.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [horarios, safeCurrentPage]);

  const startRow = horarios.length
    ? (safeCurrentPage - 1) * PAGE_SIZE + 1
    : 0;

  const endRow = Math.min(
    safeCurrentPage * PAGE_SIZE,
    horarios.length,
  );

  if (!horarios.length) {
    return (
      <>
        <style>{`
          @keyframes horario-card-enter {
            from {
              opacity: 0;
              transform: translateY(14px) scale(0.985);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}</style>

        <EmptyState
          emptyMessage={emptyMessage}
        />
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes horario-card-enter {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <section className="w-full">
        {/* Las tarjetas */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {paginatedHorarios.map(
            (row, index) => (
              <PersonScheduleCard
                key={row.id}
                row={row}
                index={index}
              />
            ),
          )}
        </div>

        {/* Paginación */}
        <div className="mt-5">
          <TablePagination
            currentPage={safeCurrentPage}
            endRow={endRow}
            itemLabel="personas"
            onNext={() =>
              setPagination({
                rowsKey,
                currentPage: Math.min(totalPages, safeCurrentPage + 1),
              })
            }
            onPrevious={() =>
              setPagination({
                rowsKey,
                currentPage: Math.max(1, safeCurrentPage - 1),
              })
            }
            pageSize={PAGE_SIZE}
            startRow={startRow}
            totalItems={horarios.length}
            totalPages={totalPages}
          />
        </div>
      </section>
    </>
  );
}

export default HorarioTable;
