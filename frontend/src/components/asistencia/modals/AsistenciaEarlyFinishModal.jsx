import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Paperclip,
  X,
} from "lucide-react";

import AsistenciaWorkDescriptionField from "./AsistenciaWorkDescriptionField";
import AsistenciaRecoveryPlanEditor from "../AsistenciaRecoveryPlanEditor";
import { ActionButton } from "@/components/ui/action-button";
import { formatLimaTime, formatLongDate } from "@/utils/asistenciaDateUtils";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

function AsistenciaEarlyFinishModal({
  block,
  description = "",
  setDescription,
  reason = "",
  setReason,
  attachment,
  setAttachment,
  recoveries = [],
  setRecoveries,
  requiredMinutes = 0,
  onError,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [currentTime, setCurrentTime] = useState(formatLimaTime(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(formatLimaTime(new Date()));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  if (!block) return null;

  const startTime = String(block.hora_inicio_programada || "").slice(0, 5);

  const endTime = String(block.hora_fin_programada || "").slice(0, 5);

  const canSubmit = description.trim().length >= 5
    && reason.trim().length >= 5
    && recoveryMinutes(recoveries) === requiredMinutes;

  // El layout de la aplicación anima/transforma su contenido. El portal mantiene
  // el modal relativo a la ventana completa y evita que un ancestro lo recorte.
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="early-finish-title"
        className="asistencia-card-enter max-h-[calc(100vh-2rem)] w-full max-w-[920px] overflow-y-auto rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
      >
        {/* Header */}
        <div className="relative overflow-hidden border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-amber-50 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-bold tracking-[0.1em] text-amber-600 uppercase">
                  Salida anticipada
                </p>

                <h2
                  id="early-finish-title"
                  className="mt-1 text-lg font-extrabold tracking-tight text-slate-900"
                >
                  ¿Deseas finalizar antes?
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Describe lo que realizaste durante el bloque antes de finalizar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Datos */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                <span className="text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                  Bloque
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-800">
                {startTime} – {endTime}
              </p>

              <p className="mt-1 text-[10px] text-slate-400 capitalize">
                {formatLongDate(block.fecha)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" />

                <span className="text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                  Hora de salida
                </span>
              </div>

              <p className="mt-2 text-sm font-bold text-slate-800">{currentTime}</p>

              <p className="mt-1 text-[10px] text-slate-400">Fin programado: {endTime}</p>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="px-6 pt-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/45 px-3.5 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="text-[11px] leading-5 text-slate-600">
              Esta acción registrará una{" "}
              <strong className="text-slate-800">salida anticipada</strong> asociada a tu
              asistencia.
            </p>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6">
          <AsistenciaWorkDescriptionField
            description={description}
            setDescription={setDescription}
            busy={busy}
          />
          <label className="mt-4 block text-xs font-bold text-slate-700" htmlFor="early-exit-reason">
            ¿Por qué necesitas salir antes?
          </label>
          <textarea
            id="early-exit-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={busy}
            rows={4}
            maxLength={1000}
            placeholder="Explica el motivo de tu salida anticipada..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
          />
          <p className="mt-1 text-[10px] text-slate-400">La solicitud será revisada por Gestión de asistencia.</p>
        </div>

        <div className="px-6 pb-6">
          <label className="block text-xs font-bold text-slate-700" htmlFor="early-exit-attachment">
            Documento o imagen <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <label htmlFor="early-exit-attachment" className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600 hover:border-amber-300">
            <Paperclip className="h-4 w-4 text-amber-600" />
            <span className="min-w-0 flex-1 truncate">{attachment?.name || "Adjunta evidencia JPG, PNG, WEBP o PDF (máx. 5 MB)"}</span>
          </label>
          <input id="early-exit-attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" disabled={busy} onChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (file && file.size > 5 * 1024 * 1024) {
              onError?.("El archivo no debe superar los 5 MB.");
              event.target.value = "";
              return;
            }
            setAttachment(file);
          }} />
          <AsistenciaRecoveryPlanEditor requiredMinutes={requiredMinutes} incidentDate={block.fecha} recoveries={recoveries} setRecoveries={setRecoveries} busy={busy} onError={onError} />
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            Cancelar
          </button>

          <ActionButton
            action="finish"
            tone="warning"
            type="button"
            onClick={onConfirm}
            loading={busy}
            loadingText="Registrando..."
            disabled={!canSubmit || busy}
          >
            Finalizar jornada
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AsistenciaEarlyFinishModal;
