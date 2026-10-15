import { createPortal } from "react-dom";
import { KeyRound, Timer, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";

export default function SendCredentialsConfirmModal({
  integrante,
  loading,
  onClose,
  onConfirm,
}) {
  if (!integrante) return null;

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-credentials-modal-title"
    >
      <div className="max-h-[calc(100vh-48px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                <KeyRound className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <h2 id="send-credentials-modal-title" className="text-base font-semibold text-slate-900">
                  Enviar credenciales
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Se generará una nueva contraseña temporal para el integrante.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <KeyRound className="h-4 w-4" strokeWidth={1.9} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {integrante.nombre || "Integrante"}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {integrante.correo || "Sin correo registrado"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm leading-6 text-slate-600">
              Se <strong className="font-semibold text-slate-800">invalida la contraseña anterior</strong> y se envía
              una nueva por correo. El integrante deberá cambiarla al iniciar sesión.
            </p>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
              <Timer className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={1.8} />
              <p className="text-xs leading-5 text-amber-800">
                La contraseña temporal expira a las 24 horas. Después de ese plazo, solicita un nuevo envío.
                Si el correo no llega, podrás reintentar en 5 minutos.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="h-10 rounded-xl px-4 text-sm font-medium shadow-none"
            >
              Cancelar
            </Button>
            <ActionButton
              action="credentials"
              type="button"
              onClick={() => onConfirm(integrante)}
              loading={loading}
              loadingText="Enviando..."
            >
              Enviar credenciales
            </ActionButton>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
