import {
  AlertCircle,
  FileText,
  MessageSquareText,
  Paperclip,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

import AsistenciaRecoveryPlanEditor from "../AsistenciaRecoveryPlanEditor";
import { ActionButton } from "@/components/ui/action-button";
import { recoveryMinutes } from "@/utils/asistenciaRecoveryUtils";

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function AsistenciaJustificationModal({
  block,
  reason = "",
  setReason,
  attachment,
  setAttachment,
  recoveries = [],
  setRecoveries,
  error = "",
  onError,
  busy = false,
  onCancel,
  onConfirm,
}) {
  if (!block) return null;

  const requiredMinutes = Number(block.minutos_incumplidos) || 0;
  const recoveryMatches = requiredMinutes > 0 && recoveryMinutes(recoveries) === requiredMinutes;
  const canSubmit = reason.trim().length >= 5 && recoveryMatches;

  const startTime = String(
    block.hora_inicio_programada || "",
  ).slice(0, 5);

  const endTime = String(
    block.hora_fin_programada || "",
  ).slice(0, 5);

  function selectAttachment(file) {
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      onError?.("Solo se permiten archivos JPG, PNG, WEBP o PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onError?.("El archivo no debe superar los 5 MB.");
      return;
    }
    onError?.("");
    setAttachment(file);
  }

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
        aria-labelledby="justification-title"
        className="
          asistencia-card-enter
          w-full
          max-h-[calc(100vh-2rem)]
          max-w-[720px]
          overflow-y-auto
          rounded-[26px]
          border
          border-slate-200
          bg-white
          shadow-[0_24px_80px_rgba(15,23,42,0.20)]
        "
      >
        {/* Header */}
        <div className="border-b border-slate-100 px-6 pb-5 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
                  Solicitud de justificación
                </p>

                <h2
                  id="justification-title"
                  className="mt-1 text-lg font-extrabold tracking-tight text-slate-900"
                >
                  Justificar esta asistencia
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Describe brevemente el motivo de la
                  situación registrada.
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

        {/* Bloque */}
        <div className="px-6 pt-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Bloque seleccionado
            </p>

            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                {startTime}
              </span>

              <span className="text-slate-300">—</span>

              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                {endTime}
              </span>
            </div>
          </div>
        </div>

        {/* Motivo */}
        <div className="px-6 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="justification-reason"
              className="text-xs font-bold text-slate-700"
            >
              Motivo de la justificación
            </label>

            <span className="text-[10px] text-slate-400">
              Obligatorio
            </span>
          </div>

          <div className="relative mt-2.5">
            <MessageSquareText className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />

            <textarea
              id="justification-reason"
              value={reason}
              onChange={(event) =>
                setReason(event.target.value)
              }
              placeholder="Explica brevemente la razón..."
              rows={5}
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
                focus:border-violet-300
                focus:bg-white
                focus:ring-4
                focus:ring-violet-50
              "
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Escribe al menos 5 caracteres.
            </span>

            <span className="text-[10px] tabular-nums text-slate-400">
              {reason.length}/500
            </span>
          </div>
        </div>

        <div className="px-6 pb-5">
          <label
            htmlFor="absence-justification-attachment"
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-violet-300 hover:bg-violet-50/50"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Paperclip className="h-4 w-4 shrink-0 text-violet-600" />
              <span className="truncate">{attachment?.name || "Adjuntar sustento (opcional)"}</span>
            </span>
            <span className="shrink-0 text-[10px] font-normal text-slate-400">Máx. 5 MB</span>
          </label>
          <input
            id="absence-justification-attachment"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            className="sr-only"
            disabled={busy}
            onChange={(event) => selectAttachment(event.target.files?.[0])}
          />

          <AsistenciaRecoveryPlanEditor
            requiredMinutes={requiredMinutes}
            incidentDate={block.fecha}
            recoveries={recoveries}
            setRecoveries={setRecoveries}
            busy={busy}
            onError={onError}
          />

          {error ? (
            <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:justify-end">
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
              disabled:pointer-events-none
              disabled:opacity-50
            "
          >
            Cancelar
          </button>

          <ActionButton
            action="send"
            type="button"
            onClick={onConfirm}
            loading={busy}
            loadingText="Enviando..."
            disabled={!canSubmit || busy}
          >
            Enviar justificación
          </ActionButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AsistenciaJustificationModal;
