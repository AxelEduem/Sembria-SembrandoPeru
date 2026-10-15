import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CheckCircle2, Clock3, X } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import AsistenciaWorkDescriptionField from "./AsistenciaWorkDescriptionField";
import { formatLimaTime, formatLongDate } from "@/utils/asistenciaDateUtils";

function AsistenciaFinishModal({
  block,
  description = "",
  setDescription,
  busy = false,
  onCancel,
  onConfirm,
}) {
  const [currentTime, setCurrentTime] = useState(formatLimaTime(new Date()));

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(formatLimaTime(new Date())), 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!block) return null;

  const startTime = String(block.hora_inicio_programada || "").slice(0, 5);
  const endTime = String(block.hora_fin_programada || "").slice(0, 5);
  const canSubmit = description.trim().length >= 5;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[3px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-attendance-title"
        className="asistencia-card-enter max-h-[calc(100vh-2rem)] w-full max-w-[520px] overflow-y-auto rounded-[26px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.20)]"
      >
        <div className="relative overflow-hidden border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="pointer-events-none absolute -top-16 -right-12 h-40 w-40 rounded-full bg-emerald-50 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-[0.1em] text-emerald-700 uppercase">
                  Cierre de jornada
                </p>
                <h2 id="finish-attendance-title" className="mt-1 text-lg font-extrabold text-slate-900">
                  Registra lo realizado
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Describe las actividades que realizaste durante este bloque.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 pt-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase">
              <CalendarDays className="h-3.5 w-3.5" /> Bloque
            </div>
            <p className="mt-2 text-sm font-bold text-slate-800">{startTime} – {endTime}</p>
            <p className="mt-1 text-[10px] text-slate-400 capitalize">{formatLongDate(block.fecha)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase">
              <Clock3 className="h-3.5 w-3.5" /> Hora de salida
            </div>
            <p className="mt-2 text-sm font-bold text-slate-800">{currentTime}</p>
            <p className="mt-1 text-[10px] text-slate-400">Fin programado: {endTime}</p>
          </div>
        </div>

        <div className="px-6 py-5">
          <AsistenciaWorkDescriptionField
            description={description}
            setDescription={setDescription}
            busy={busy}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={busy} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Cancelar
          </button>
          <ActionButton
            action="finish"
            type="button"
            onClick={onConfirm}
            loading={busy}
            loadingText="Registrando..."
            disabled={!canSubmit}
          >
            Finalizar jornada
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AsistenciaFinishModal;
