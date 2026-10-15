import { createPortal } from "react-dom";
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  MessageSquareText,
  ShieldAlert,
  X,
} from "lucide-react";

import {
  formatDuration,
  formatLimaTime,
  formatLongDate,
} from "@/utils/asistenciaDateUtils";
import AsistenciaRecoveryPlanEditor from "../AsistenciaRecoveryPlanEditor";
import { ActionButton } from "@/components/ui/action-button";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

function AsistenciaLateEntryModal({
  block,
  lateMinutes = 0,
  occurredAt,
  reason = "",
  setReason,
  recoveries = [],
  setRecoveries,
  onError,
  busy = false,
  onCancel,
  onConfirm,
}) {
  if (!block) return null;

  const startTime = String(
    block.hora_inicio_programada || "",
  ).slice(0, 5);

  const endTime = String(
    block.hora_fin_programada || "",
  ).slice(0, 5);

  const canSubmit = reason.trim().length >= 5 && recoveryMinutes(recoveries) === lateMinutes;

  // El layout de la aplicación anima/transforma su contenido. Un portal evita que
  // ese contenedor convierta el `fixed` en relativo a la página.
  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-slate-950/40
        p-4
        backdrop-blur-[3px]
      "
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="late-entry-title"
        className="
          asistencia-card-enter
          flex
          max-h-[calc(100vh-2rem)]
          w-full
          max-w-[920px]
          flex-col
          overflow-hidden
          rounded-[26px]
          border
          border-slate-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.2)]
        "
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-slate-100 px-6 pb-5 pt-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-amber-50 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-amber-100
                  bg-amber-50
                  text-amber-600
                "
              >
                <ShieldAlert className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-amber-600
                  "
                >
                  Ingreso fuera de horario
                </p>

                <h2
                  id="late-entry-title"
                  className="
                    mt-1
                    text-lg
                    font-extrabold
                    tracking-tight
                    text-slate-900
                  "
                >
                  Estás ingresando tarde
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Para registrar este ingreso necesitamos
                  conocer el motivo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
                disabled:pointer-events-none
                disabled:opacity-50
              "
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="lg:border-r lg:border-slate-100">
        {/* Resumen */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-slate-50/70
                p-3.5
              "
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                  Bloque
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-800">
                {startTime} – {endTime}
              </p>

              <p className="mt-1 text-[10px] capitalize text-slate-400">
                {formatLongDate(block.fecha)}
              </p>
            </div>

            <div
              className="
                rounded-2xl
                border
                border-amber-100
                bg-amber-50/60
                p-3.5
              "
            >
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-amber-600" />

                <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-600">
                  Retraso
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-amber-800">
                {formatDuration(lateMinutes)}
              </p>

              <p className="mt-1 text-[10px] text-amber-700/70">
                Hora considerada: {formatLimaTime(occurredAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="px-6 pt-4">
          <div
            className="
              flex
              items-start
              gap-3
              rounded-xl
              border
              border-amber-100
              bg-amber-50/45
              px-3.5
              py-3
            "
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-[11px] leading-5 text-slate-600">
              El bloque estaba programado para iniciar a las{" "}
              <strong className="text-slate-800">
                {startTime}
              </strong>
              . El retraso se calculó cuando presionaste iniciar y no cambiará mientras completas
              este formulario. El motivo quedará asociado al registro de tu ingreso.
            </p>
          </div>
        </div>

        {/* Campo */}
        <div className="px-6 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="late-entry-reason"
              className="text-xs font-bold text-slate-700"
            >
              Motivo del ingreso tardío
            </label>

            <span className="text-[10px] text-slate-400">
              Obligatorio
            </span>
          </div>

          <div className="relative mt-2.5">
            <MessageSquareText className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

            <textarea
              id="late-entry-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Escribe brevemente por qué ingresaste tarde..."
              rows={4}
              maxLength={500}
              autoFocus
              className="
                w-full
                resize-none
                rounded-2xl
                border
                border-slate-200
                bg-slate-50/50
                px-10
                py-3
                text-sm
                leading-5
                text-slate-700
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-emerald-300
                focus:bg-white
                focus:ring-4
                focus:ring-emerald-50
              "
            />
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] leading-4 text-slate-400">
              Escribe al menos 5 caracteres.
            </p>

            <span className="text-[10px] tabular-nums text-slate-400">
              {reason.length}/500
            </span>
          </div>
        </div>

          </div>

          <div className="px-6 pb-6 lg:bg-slate-50/30">
            <AsistenciaRecoveryPlanEditor requiredMinutes={lateMinutes} incidentDate={block.fecha} recoveries={recoveries} setRecoveries={setRecoveries} busy={busy} onError={onError} />
          </div>
        </div>

        {/* Footer */}
        <div
          className="
            flex
            flex-col-reverse
            gap-2
            border-t
            border-slate-100
            bg-slate-50/50
            px-6
            py-4
            shrink-0
            sm:flex-row
            sm:justify-end
          "
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="
              h-10
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-xs
              font-semibold
              text-slate-600
              transition
              hover:bg-slate-50
              hover:text-slate-800
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <ActionButton
            action="confirm"
            type="button"
            onClick={onConfirm}
            loading={busy}
            loadingText="Registrando..."
            disabled={!canSubmit || busy}
          >
            Registrar ingreso
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AsistenciaLateEntryModal;
