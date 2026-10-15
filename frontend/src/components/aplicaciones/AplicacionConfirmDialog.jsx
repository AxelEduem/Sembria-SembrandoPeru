import { AlertTriangle, Power, Check } from "lucide-react";

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

function AplicacionConfirmDialog({
  open,
  aplicacion,
  action = "deactivate",
  loading,
  onOpenChange,
  onConfirm,
}) {
  const isDeactivating = action === "deactivate";

  function handleOpenChange(value) {
    if (loading) {
      return;
    }

    onOpenChange(value);
  }

  const title = isDeactivating ? "Desactivar aplicación" : "Activar aplicación";

  const description = isDeactivating
    ? "La aplicación dejará de estar disponible para nuevas asignaciones, pero conservará su registro en el sistema."
    : "La aplicación volverá a estar disponible para nuevas asignaciones.";

  const warningMessage = isDeactivating
    ? "La aplicación conservará toda su información y podrá volver a activarse posteriormente."
    : "La aplicación volverá a estar disponible para su asignación.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[440px]">
        <DialogHeader className="border-b border-slate-100 px-6 pt-6 pb-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                isDeactivating
                  ? "border-amber-100 bg-amber-50 text-amber-600"
                  : "border-emerald-100 bg-emerald-50 text-emerald-600"
              }`}
            >
              {isDeactivating ? (
                <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <Check className="h-5 w-5" strokeWidth={1.9} />
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

        {aplicacion && (
          <div className="px-6 pt-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {aplicacion.imagen_url ? (
                    <img
                      src={aplicacion.imagen_url}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    <Power className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {aplicacion.nombre}
                  </p>

                  <p className="mt-0.5 truncate text-xs leading-5 text-slate-500">
                    {aplicacion.descripcion || "Sin descripción registrada"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 pt-4">
          <div
            className={`rounded-xl border px-3.5 py-3 text-xs leading-5 ${
              isDeactivating
                ? "border-amber-100 bg-amber-50/60 text-amber-700"
                : "border-emerald-100 bg-emerald-50/60 text-emerald-700"
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
            action={isDeactivating ? "deactivate" : "activate"}
            tone={isDeactivating ? "warning" : "primary"}
            type="button"
            onClick={onConfirm}
            loading={loading}
            loadingText={isDeactivating ? "Desactivando..." : "Activando..."}
            className="w-full sm:w-auto"
          >
            {isDeactivating ? "Desactivar" : "Activar"}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AplicacionConfirmDialog;
