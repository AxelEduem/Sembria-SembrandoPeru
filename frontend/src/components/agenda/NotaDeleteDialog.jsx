import { AlertTriangle, StickyNote, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function NotaDeleteDialog({ open, note, loading, onOpenChange, onConfirm }) {
  function handleOpenChange(nextOpen) {
    if (!loading) onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[460px]">
        <DialogHeader className="border-b border-slate-100 px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold tracking-tight text-slate-900">
                Eliminar nota
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
                Confirma si deseas eliminar permanentemente esta nota personal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {note ? (
          <div className="space-y-4 px-6 py-5">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                <StickyNote className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-800">{note.titulo}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                  {note.contenido || "Esta nota no tiene contenido adicional."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Esta acción no se puede deshacer y la nota dejará de estar disponible en tu cuenta.</p>
            </div>
          </div>
        ) : null}

        <DialogFooter className="border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading} className="w-full rounded-xl sm:w-auto">
            Cancelar
          </Button>
          <ActionButton
            action="delete"
            tone="danger"
            type="button"
            onClick={onConfirm}
            loading={loading}
            loadingText="Eliminando..."
            className="w-full sm:w-auto"
          >
            Eliminar nota
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
