import { createPortal } from "react-dom";
import { useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";

export default function IntegranteDeactivateModal({ confirm, onClose, onConfirm, onReasonChange }) {
  const [deactivating, setDeactivating] = useState(false);

  if (!confirm) {
    return null;
  }

  const isRestore = confirm.action === "restore";
  const reason = confirm.reason || "";

  const handleClose = () => {
    if (deactivating) return;
    setDeactivating(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (deactivating) return;
    if (!isRestore && !reason.trim()) return;

    setDeactivating(true);
    try {
      const result = await onConfirm();
      if (!result?.success) {
        setDeactivating(false);
      } else {
        setDeactivating(false);
      }
      return result;
    } catch (error) {
      setDeactivating(false);
      throw error;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-modal-title"
    >
      <div className="max-h-[calc(100vh-48px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isRestore
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                    : "border-red-100 bg-red-50 text-red-600"
                }`}
              >
                {isRestore ? (
                  <RefreshCw className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
                )}
              </div>

              <div className="min-w-0">
                <h2 id="deactivate-modal-title" className="text-base font-semibold text-slate-900">
                  {isRestore
                    ? "Activar integrante"
                    : deactivating
                      ? "Desactivando integrante"
                      : "Desactivar integrante"}
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {isRestore
                    ? "Confirma que deseas activar nuevamente al integrante."
                    : deactivating
                      ? "Estamos registrando la desactivación del integrante."
                      : "Registra el motivo para completar la desactivación."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={deactivating}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* ACTIVAR */}
          {isRestore && (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <RefreshCw className="h-4 w-4" strokeWidth={1.9} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Activar integrante</p>
                    <p className="mt-1 text-xs leading-5 text-emerald-700/80">
                      El integrante volverá a quedar activo con su periodo actual.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={deactivating}
                  className="h-10 rounded-xl px-4 text-sm font-medium shadow-none"
                >
                  Cancelar
                </Button>

                <ActionButton
                  action="activate"
                  type="button"
                  onClick={handleConfirm}
                  loading={deactivating}
                  loadingText="Activando..."
                >
                  Activar integrante
                </ActionButton>
              </div>
            </div>
          )}

          {/* DESACTIVAR */}
          {!isRestore && (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="deactivation-reason"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Motivo de desactivación <span className="ml-1 text-red-500">*</span>
                </label>
                <textarea
                  id="deactivation-reason"
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  placeholder="Escribe el motivo por el que se desactiva al integrante..."
                  rows={4}
                  autoFocus
                  disabled={deactivating}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-5 text-slate-700 transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] leading-4 text-slate-400">
                    El motivo quedará registrado en el historial.
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {reason.length} caracteres
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={deactivating}
                  className="h-10 rounded-xl px-4 text-sm font-medium shadow-none"
                >
                  Cancelar
                </Button>
                <ActionButton
                  action="deactivate"
                  tone="danger"
                  type="button"
                  onClick={handleConfirm}
                  loading={deactivating}
                  loadingText="Desactivando..."
                  disabled={!reason.trim() || deactivating}
                >
                  Desactivar integrante
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
