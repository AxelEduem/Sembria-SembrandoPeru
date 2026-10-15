import { AlertTriangle } from "lucide-react";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";

function AccesoConfirmDialog({
  open,
  asignacion,
  asignaciones = [],
  removeAll = false,
  loading,
  onOpenChange,
  onConfirm,
}) {
  const [confirmed, setConfirmed] = useState(false);

  const targets = asignaciones.length > 0 ? asignaciones : asignacion ? [asignacion] : [];
  const isBulk = removeAll || targets.length > 1;
  const target = targets[0];

  function handleOpenChange(value) {
    if (loading) {
      return;
    }

    setConfirmed(false);

    onOpenChange(value);
  }

  function handleConfirm() {
    setConfirmed(false);
    onConfirm();
  }

  const voluntario = target?.voluntario;

  const aplicacion = target?.aplicacion;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[430px]">
        <div className="px-6 pt-6">
          <DialogHeader className="text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertTriangle className="h-4.5 w-4.5" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-slate-900">
                  {isBulk ? "Quitar todos los accesos" : "Quitar acceso"}
                </DialogTitle>

                <DialogDescription className="mt-1 text-xs leading-5 text-slate-500">
                  {isBulk
                    ? "Antes de continuar, asegúrate de haber retirado los accesos directamente en las aplicaciones correspondientes."
                    : "Antes de continuar, asegúrate de haber retirado el acceso directamente en la aplicación correspondiente."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {target && (
            <div className="mt-5">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {voluntario?.nombre || "Integrante"}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {isBulk
                      ? `${targets.length} aplicaciones asignadas`
                      : aplicacion?.nombre || "Aplicación"}
                  </p>
                </div>

                {voluntario?.area && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    {voluntario.area}
                    {voluntario.cargo ? ` · ${voluntario.cargo}` : ""}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
              strokeWidth={1.8}
            />

            <span>
              {isBulk
                ? "Sembria solo registrará el retiro. Esta acción no desactiva las cuentas ni revoca los accesos dentro de las aplicaciones externas."
                : `Sembria solo registrará el retiro. Esta acción no desactiva la cuenta ni revoca el acceso dentro de ${aplicacion?.nombre || "la aplicación externa"}.`}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-3">
            <input
              type="checkbox"
              id="confirm-access-removal"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 cursor-pointer rounded border-blue-200 bg-white text-blue-600 focus:ring-blue-500"
            />

            <label
              htmlFor="confirm-access-removal"
              className="cursor-pointer text-xs font-medium text-slate-700 select-none"
            >
              {isBulk
                ? "Confirmo que ya retiré los accesos en las aplicaciones correspondientes"
                : "Confirmo que ya retiré el acceso en la aplicación correspondiente"}
            </label>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="w-full rounded-xl sm:w-auto"
          >
            Cancelar
          </Button>

          <ActionButton
            action="delete"
            tone="danger"
            type="button"
            onClick={handleConfirm}
            loading={loading}
            loadingText="Quitando..."
            disabled={loading || !confirmed}
            className="w-full sm:w-auto"
          >
            {isBulk ? "Quitar todos" : "Quitar acceso"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AccesoConfirmDialog;
