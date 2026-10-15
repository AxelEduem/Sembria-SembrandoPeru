import { useState } from "react";
import { AtSign, Check, Copy, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
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

const DOMAIN = "@sembrandoperu.org";

export default function EditEmailDialog({
  open,
  usuario,
  loading,
  onOpenChange,
  onSubmit,
  onFeedback,
}) {
  const currentLocalPart = (usuario?.correo || "").replace(/@.*$/, "");
  const [localPart, setLocalPart] = useState(currentLocalPart);
  const [updatedEmail, setUpdatedEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const { primaryOpen, resultOpen, showResult, closeAll } = useSequentialDialog(onOpenChange);

  async function submit(event) {
    event.preventDefault();

    const normalized = localPart.trim().toLowerCase();
    if (!normalized || !/^[a-z0-9._-]+$/.test(normalized)) {
      onFeedback("error", "Ingresa un correo institucional válido.");
      return;
    }

    const correo = `${normalized}${DOMAIN}`;

    if (correo === usuario?.correo) {
      onFeedback("error", "El correo es el mismo que el actual.");
      return;
    }

    const result = await onSubmit({ integranteId: usuario.integrante_id, correo });

    if (!result?.success) {
      return;
    }

    setUpdatedEmail(correo);
    showResult();
  }

  async function copyAccess() {
    if (!updatedEmail) return;

    const ok = await copyToClipboard(
      `Correo: ${updatedEmail}\nContraseña: conserva la contraseña actual.`,
    );

    if (ok) {
      setCopied(true);
      onFeedback("success", "Acceso copiado al portapapeles.");
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      onFeedback("error", "No se pudo copiar el acceso al portapapeles.");
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
          className="overflow-hidden p-0 duration-300 sm:max-w-lg"
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px] duration-300"
        >
          <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-6 py-6">
            <div className="absolute -top-14 -right-12 h-36 w-36 rounded-full bg-emerald-200/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">
                <Mail className="h-6 w-6" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 pr-6">
                <DialogTitle className="text-xl text-slate-900">Editar correo institucional</DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-5 text-slate-600">
                  Actualiza el correo que {usuario?.nombre} utilizará para ingresar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submit}>
            <div className="space-y-5 bg-slate-50/70 px-6 py-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Correo actual</p>
                <p className="mt-1 break-all text-sm font-semibold text-slate-700">{usuario?.correo}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <label htmlFor="usuario-email" className="text-xs font-semibold text-slate-600">
                  Nuevo correo institucional
                </label>
                <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white transition-[border-color,box-shadow] focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10">
                  <div className="flex items-center pl-3 text-slate-400">
                    <AtSign className="h-4 w-4" />
                  </div>
                  <Input
                    id="usuario-email"
                    value={localPart}
                    onChange={(event) => {
                      setLocalPart(event.target.value.replace(/@.*$/, "").replace(/\s/g, ""));
                    }}
                    className="h-11 rounded-none border-0 px-2 shadow-none focus-visible:ring-0"
                    disabled={loading}
                    autoFocus
                  />
                  <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                    {DOMAIN}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                <p className="text-xs leading-5 text-sky-800">
                  La contraseña actual no cambiará. Solo se actualizará el correo de ingreso.
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
                action="save"
                type="submit"
                loading={loading}
                loadingText="Guardando..."
              >
                Guardar correo
              </ActionButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open && resultOpen} onOpenChange={(value) => !value && closeAll()}>
        <DialogContent
          className="overflow-hidden p-0 duration-500 data-[state=closed]:slide-out-to-bottom-3 data-[state=open]:slide-in-from-bottom-4 sm:max-w-md"
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px] duration-500"
          showCloseButton
        >
          <div className="relative overflow-hidden px-7 pt-9 pb-8 text-center">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-emerald-100/80 to-transparent" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-8 ring-emerald-50">
                <Check className="h-8 w-8" strokeWidth={2} />
              </div>
              <DialogHeader className="mt-6 items-center text-center sm:text-center">
                <DialogTitle className="text-xl">Correo actualizado</DialogTitle>
                <DialogDescription className="max-w-sm text-sm leading-6 text-slate-500">
                  {usuario?.nombre} ya puede ingresar con el nuevo correo institucional.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700/70">
                  Nuevo correo de acceso
                </p>
                <p className="mt-2 break-all font-mono text-sm font-semibold text-slate-700">
                  {updatedEmail}
                </p>
                <p className="mt-3 text-xs text-slate-500">La contraseña actual se mantiene sin cambios.</p>
              </div>

              <Button
                type="button"
                onClick={copyAccess}
                className="mt-6 w-full rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Acceso copiado" : "Copiar acceso"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
