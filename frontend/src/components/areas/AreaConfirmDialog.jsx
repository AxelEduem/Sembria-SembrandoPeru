import { AlertTriangle, Building2, Check } from "lucide-react";

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

function AreaConfirmDialog({
  open,
  area,
  action = "deactivate",
  loading,
  onOpenChange,
  onConfirm,
}) {
  const isActivating = action === "activate";

  const title = isActivating ? "Activar área" : "Desactivar área";

  const description = isActivating
    ? "El área volverá a estar disponible para nuevas asignaciones."
    : "El área dejará de estar disponible para nuevas asignaciones, pero conservará su registro en el sistema.";

  const warningMessage = isActivating
    ? "El área volverá a estar disponible para nuevas asignaciones."
    : "Toda la información del área se conservará y podrá volver a activarse posteriormente.";

  function handleOpenChange(value) {
    if (loading) {
      return;
    }

    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[440px]">
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                isActivating
                  ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                  : "border-amber-100 bg-amber-50 text-amber-600"
              }`}
            >
              {isActivating ? (
                <Check className="h-5 w-5" strokeWidth={1.9} />
              ) : (
                <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
              )}
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                {title}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {area && (
          <div className="px-6 pt-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
                  <Building2 className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words text-slate-800">{area.nombre}</p>

                  {area.descripcion && (
                    <p className="mt-0.5 line-clamp-2 text-xs leading-5 break-words text-slate-500">
                      {area.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pt-4">
          <div
            className={`rounded-xl border px-3.5 py-3 text-xs leading-5 ${
              isActivating
                ? "border-emerald-100 bg-emerald-50/60 text-emerald-700"
                : "border-amber-100 bg-amber-50/60 text-amber-700"
            }`}
          >
            {warningMessage}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 px-6 pt-5 pb-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>

          <ActionButton
            action={isActivating ? "activate" : "deactivate"}
            tone={isActivating ? "primary" : "warning"}
            type="button"
            onClick={onConfirm}
            loading={loading}
            loadingText={isActivating ? "Activando..." : "Desactivando..."}
            className="w-full sm:w-auto"
          >
            {isActivating ? "Activar" : "Desactivar"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AreaConfirmDialog;
