import { useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

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
import { useSequentialDialog } from "@/hooks/useSequentialDialog";
import { copyToClipboard } from "@/utils/formHelpers";

export default function ResendCredentialsDialog({
  open,
  usuario,
  loading,
  onOpenChange,
  onConfirm,
  onFeedback,
}) {
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const { primaryOpen, resultOpen, showResult, closeAll } = useSequentialDialog(onOpenChange);

  async function handleConfirm() {
    const response = await onConfirm();

    if (!response?.success) return;

    const credentials = {
      correo: usuario?.correo,
      password: response.data?.password,
    };
    setResult(credentials);
    await copyCredentials(credentials);
    showResult();
  }

  async function copyCredentials(credentials = result) {
    if (!credentials) return;

    const ok = await copyToClipboard(
      `Correo: ${credentials.correo}\nContraseña temporal: ${credentials.password}\nIngresa al sistema y cambia tu contraseña en el primer acceso.`,
    );

    if (ok) {
      setCopied(true);
      onFeedback("success", "Credenciales copiadas al portapapeles.");
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      onFeedback("error", "No se pudieron copiar las credenciales al portapapeles.");
    }
  }

  function closePrimary(value) {
    if (loading) return;
    if (!value) closeAll();
  }

  return (
    <>
      <Dialog open={open && primaryOpen} onOpenChange={closePrimary}>
        <DialogContent
          showCloseButton={!loading}
          className="overflow-hidden p-0 duration-300 sm:max-w-xl"
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px] duration-300"
        >
          <DialogHeader className="relative overflow-hidden border-b border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-6 py-6">
            <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-amber-200/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-600 shadow-sm">
                <RefreshCw className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 pr-6">
                <DialogTitle className="text-xl text-slate-900">Restablecer contraseña</DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-5 text-slate-600">
                  Genera una nueva contraseña temporal para {usuario?.nombre}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 bg-slate-50/70 px-6 py-6">
            <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Este cambio es inmediato</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
                    <li>La contraseña anterior dejará de funcionar.</li>
                    <li>Se cerrará cualquier sesión activa.</li>
                    <li>La nueva contraseña deberá cambiarse en el próximo ingreso.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <p className="text-xs leading-5 text-emerald-800">
                Al restablecerla, las nuevas credenciales se copiarán automáticamente al portapapeles.
              </p>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => closePrimary(false)}
              disabled={loading}
              className="rounded-xl border-slate-300"
            >
              Cancelar
            </Button>
            <ActionButton
              action="refresh"
              type="button"
              onClick={handleConfirm}
              loading={loading}
              loadingText="Restableciendo..."
            >
              Restablecer contraseña
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open && resultOpen} onOpenChange={(value) => !value && closeAll()}>
        <DialogContent
          className="overflow-hidden p-0 duration-500 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-4 sm:max-w-lg"
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px] duration-500"
          showCloseButton
        >
          <div className="relative overflow-hidden px-7 pt-8 pb-7">
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-100/80 to-transparent" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-8 ring-emerald-50">
                <KeyRound className="h-8 w-8" strokeWidth={1.8} />
              </div>
              <DialogHeader className="mt-6 items-center text-center sm:text-center">
                <DialogTitle className="text-xl">Contraseña restablecida</DialogTitle>
                <DialogDescription className="max-w-sm text-sm leading-6 text-slate-500">
                  {usuario?.nombre} ya cuenta con nuevas credenciales temporales.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4 font-mono text-sm text-slate-700 shadow-sm">
                  <p>
                    <span className="font-sans text-xs text-slate-400">Correo</span>
                    <span className="mt-1 block break-all">{result?.correo}</span>
                  </p>
                  <div className="h-px bg-slate-100" />
                  <p>
                    <span className="font-sans text-xs text-slate-400">Contraseña temporal</span>
                    <span className="mt-1 block break-all">{result?.password}</span>
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={copyCredentials}
                className="mt-6 w-full rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Credenciales copiadas" : "Copiar credenciales"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
