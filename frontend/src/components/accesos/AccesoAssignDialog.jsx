import AccesoAssignForm from "@/components/accesos/AccesoAssignForm";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function AccesoAssignDialog({ open, onOpenChange, ...formProps }) {
  function handleOpenChange(value) {
    if (formProps.saving) return;
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-slate-200 p-0 sm:max-w-[680px]"
        closeClassName="text-white hover:bg-white/10 hover:text-white"
      >
        <DialogHeader className="border-b border-emerald-900/10 bg-gradient-to-r from-[#214B32] to-[#2D5A3D] px-6 py-5 text-left text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <KeyRound className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <DialogTitle className="text-base text-white">Gestionar accesos</DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-5 text-emerald-50/80">
                Asigna nuevas licencias o retira los accesos actuales del integrante.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5">
          <AccesoAssignForm {...formProps} embedded />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AccesoAssignDialog;
