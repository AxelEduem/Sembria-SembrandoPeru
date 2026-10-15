import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Play,
  ShieldCheck,
  Square,
  
} from "lucide-react";


import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  getLimaMinutesNow,
  getTimeMinutes,
} from "@/utils/asistenciaDateUtils";

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(remaining).padStart(2, "0"),
  ].join(":");
}

function formatDuration(minutes = 0) {
  const value = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(value / 60);
  const mins = value % 60;

  if (!hours) return `${mins} min`;
  if (!mins) return `${hours}h`;

  return `${hours}h ${mins}m`;
}

function StateIcon({ state }) {
  const icons = {
    pendiente: Clock3,
    en_jornada: ActivityIcon,
    completada: CheckCircle2,
    jornada_abierta: CircleAlert,
    falta: AlertCircle,
    justificada: ShieldCheck,
    permiso: ShieldCheck,
  };

  const Icon = icons[state] || Clock3;

  return <Icon className="h-3.5 w-3.5" strokeWidth={2} />;
}

function ActivityIcon({ className = "" }) {
  return (
    <span className={`relative block h-3.5 w-3.5 ${className}`}>
      <span className="absolute inset-0.75 rounded-full bg-current" />
      <span className="asistencia-live-dot absolute inset-0 rounded-full border border-current opacity-50" />
    </span>
  );
}

const STATE_CONFIG = {
  pendiente: {
    label: "Pendiente",
    className: "border-slate-200 bg-slate-50 text-slate-600",
    accent: "bg-slate-400",
  },

  en_jornada: {
    label: "En jornada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
  },

  completada: {
    label: "Completada",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    accent: "bg-emerald-500",
  },

  jornada_abierta: {
    label: "Jornada abierta",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    accent: "bg-amber-500",
  },

  falta: {
    label: "Falta",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    accent: "bg-rose-500",
  },

  justificada: {
    label: "Justificada",
    className: "border-violet-200 bg-violet-50 text-violet-700",
    accent: "bg-violet-500",
  },
  permiso: {
    label: "Permiso aprobado",
    className: "border-cyan-200 bg-cyan-50 text-cyan-700",
    accent: "bg-cyan-500",
  },
};

function Counter({ started }) {
  const [seconds, setSeconds] = React.useState(0);

  React.useEffect(() => {
    if (!started) return undefined;

    const update = () => {
      const start = new Date(started).getTime();

      if (!Number.isFinite(start)) return;

      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [started]);

  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Tiempo transcurrido
      </p>

      <p className="mt-1 font-mono text-[30px] font-semibold tracking-[0.04em] text-emerald-700 sm:text-[34px]">
        {formatClock(seconds)}
      </p>
    </div>
  );
}

export default function AsistenciaBlockCard({
  block,
  index,
  busy = false,
  onStart,
  onFinish,
  onEarlyFinish,
}) {
  const state = block.estado || "pendiente";
  const isRecovery = block.tipo_bloque === "recuperacion";


  const [currentMinutes, setCurrentMinutes] = React.useState(
  getLimaMinutesNow(),
);

React.useEffect(() => {
  const interval = window.setInterval(() => {
    setCurrentMinutes(getLimaMinutesNow());
  }, 30_000);

  return () => window.clearInterval(interval);
}, []);

const startMinutes = getTimeMinutes(block.hora_inicio_programada);
const endMinutes = getTimeMinutes(block.hora_fin_programada);

// Permite iniciar desde 5 minutos antes de la hora programada.
const canStart =
  state === "pendiente" &&
  startMinutes !== null &&
  endMinutes !== null &&
  currentMinutes >= startMinutes - 5 &&
  currentMinutes < endMinutes;

const [today] = React.useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date()));
const isForgottenOpen = state === "en_jornada" && String(block.fecha) < today;
const isEarlyFinish = !isForgottenOpen && endMinutes !== null && currentMinutes < endMinutes;


  const config = STATE_CONFIG[state] || STATE_CONFIG.pendiente;

  const scheduled = Number(block.minutos_programados) || 0;
  const realized = Number(block.minutos_realizados) || 0;
  const progress =
    scheduled > 0 ? Math.min(100, Math.round((realized / scheduled) * 100)) : 0;

  const incidents = Array.isArray(block.asistencia_incidencias)
    ? block.asistencia_incidencias
    : [];

  const showProgress =
    state === "completada" ||
    state === "jornada_abierta" ||
    state === "justificada";

  const title = isRecovery
    ? "Bloque de recuperación"
    : index === 0
      ? "Primer bloque"
      : index === 1
        ? "Segundo bloque"
        : `Bloque ${String(index + 1).padStart(2, "0")}`;

  return (
    <article
      className={`
        asistencia-card-enter
        relative
        overflow-hidden
        rounded-3xl
        border
        bg-white
        p-5
        shadow-[0_4px_18px_rgba(15,23,42,0.04)]
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]
        ${
          state === "en_jornada"
            ? "asistencia-active-card border-emerald-200"
            : "border-slate-200"
        }
      `}
      style={{
        animationDelay: `${index * 90}ms`,
      }}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${config.accent}`}
        aria-hidden="true"
      />

      <div className="pl-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                {String(index + 1).padStart(2, "0")}
              </span>

              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {title}
              </p>
              {isRecovery ? (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold tracking-wide text-violet-700 uppercase ring-1 ring-violet-100">
                  Recuperación
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
                {String(block.hora_inicio_programada).slice(0, 5)}
              </p>

              <ChevronRight className="h-4 w-4 text-slate-300" />

              <p className="text-[22px] font-bold tracking-tight text-slate-900 sm:text-[24px]">
                {String(block.hora_fin_programada).slice(0, 5)}
              </p>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              {formatDuration(scheduled)} programados
            </p>
          </div>

          <Badge
            variant="outline"
            className={`gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.className}`}
          >
            <StateIcon state={state} />
            {config.label}
          </Badge>
        </div>

        {state === "en_jornada" ? (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            {isForgottenOpen ? (
              <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-800">
                Esta jornada quedó abierta en una fecha anterior. Registra la salida para cerrarla.
              </p>
            ) : null}
            <div className="flex flex-col items-center">
              <Counter started={block.hora_entrada} />

              <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
                <span>
                  Inicio:{" "}
                  <strong className="text-slate-700">
                    {new Intl.DateTimeFormat("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "America/Lima",
                    }).format(new Date(block.hora_entrada))}
                  </strong>
                </span>

                <span>
                  Fin programado:{" "}
                  <strong className="text-slate-700">
                    {String(block.hora_fin_programada).slice(0, 5)}
                  </strong>
                </span>
              </div>

              {isEarlyFinish ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={busy}
                  onClick={onEarlyFinish}
                  className="mt-5 w-full rounded-xl border-amber-200 text-amber-800 hover:bg-amber-50 sm:w-auto sm:min-w-55"
                >
                  <Clock3 className="mr-2 h-4 w-4" />
                  {isRecovery ? "Finalizar recuperación anticipada" : "Finalizar jornada anticipada"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  disabled={busy}
                  onClick={onFinish}
                  className="mt-5 w-full rounded-xl bg-red-500 text-white shadow-sm hover:bg-red-600 sm:w-auto sm:min-w-55"
                >
                  <Square className="mr-2 h-4 w-4" />
                  {isRecovery ? "Finalizar recuperación" : "Finalizar jornada"}
                </Button>
              )}
            </div>
          </div>
        ) : state === "pendiente" ? (
          <div className="mt-6">
            <Button
  type="button"
  size="lg"
  disabled={busy || !canStart}
  onClick={onStart}
  title={
    !canStart
      ? `Disponible desde 5 minutos antes de las ${String(
          block.hora_inicio_programada,
        ).slice(0, 5)}.`
      : undefined
  }
  className="
    w-full
    rounded-xl
    bg-[#2D5A3D]
    text-white
    shadow-sm
    transition-all
    hover:-translate-y-0.5
    hover:bg-[#234B32]
    hover:shadow-md
    disabled:cursor-not-allowed
    disabled:bg-slate-300
    disabled:text-slate-500
    disabled:shadow-none
  "
>
  <Play className="mr-2 h-4 w-4 fill-current" />
  {canStart
    ? isRecovery ? "Iniciar recuperación" : "Iniciar jornada"
    : "Aún no disponible"}
</Button>
          </div>
        ) : (
          <div className="mt-5">
            {state === "permiso" ? <p className="rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-center text-xs font-semibold text-cyan-800">No necesitas marcar asistencia en este bloque. Tu permiso fue aprobado y las horas tienen un plan de recuperación.</p> : null}
            {block.hora_entrada || block.hora_salida ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Entrada
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {block.hora_entrada
                      ? new Intl.DateTimeFormat("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Lima",
                        }).format(new Date(block.hora_entrada))
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Salida
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {block.hora_salida
                      ? new Intl.DateTimeFormat("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Lima",
                        }).format(new Date(block.hora_salida))
                      : "Pendiente"}
                  </p>
                </div>
              </div>
            ) : null}

            {showProgress ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold text-slate-500">
                    Cumplimiento del bloque
                  </span>

                  <span className="text-[10px] font-bold text-slate-700">
                    {progress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      state === "justificada"
                        ? "bg-violet-500"
                        : progress >= 100
                          ? "bg-emerald-500"
                          : "bg-amber-400"
                    }`}
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  <strong className="text-slate-700">
                    {formatDuration(realized)}
                  </strong>{" "}
                  de {formatDuration(scheduled)}
                  {Number(block.minutos_incumplidos) > 0
                    ? ` · ${formatDuration(block.minutos_incumplidos)} incumplidos`
                    : ""}
                </p>
              </div>
            ) : null}

            {incidents.length ? (
              <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-amber-700">
                  Incidencias
                </p>

                <div className="space-y-1.5">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-medium text-slate-700">
                        {String(incident.tipo || "observacion").replaceAll(
                          "_",
                          " ",
                        )}
                      </span>

                      {incident.minutos ? (
                        <span className="font-semibold text-amber-700">
                          {incident.minutos} min
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        )}
      </div>
    </article>
  );
}
