import { useState } from "react";
import {
  AtSign,
  ClipboardCheck,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

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
import { buildCorreoSugerido, copyToClipboard, randomPassword } from "@/utils/formHelpers";

const DOMAIN = "@sembrandoperu.org";

function buildCredentialsMessage({ nombre, correo, password }) {
  return `¡Hola, ${nombre}!

Tu acceso a Sembria ya está listo.

Correo institucional: ${correo}
Contraseña temporal: ${password}

Al ingresar por primera vez, el sistema te pedirá cambiar la contraseña. Por seguridad, no compartas estas credenciales con otras personas.`;
}

export default function ConfigurarAccesoDialog({
  open,
  usuario,
  loading,
  onOpenChange,
  onSubmit,
  onFeedback,
}) {
  const [correo, setCorreo] = useState(() =>
    buildCorreoSugerido(usuario?.nombres, usuario?.apellidos),
  );
  const [password, setPassword] = useState(() => randomPassword());
  const [showPassword, setShowPassword] = useState(true);
  const [created, setCreated] = useState(null);
  const [clipboardCopied, setClipboardCopied] = useState(false);
  const { primaryOpen, resultOpen, showResult, closeAll } = useSequentialDialog(onOpenChange);

  async function copyCreatedMessage(credentials, notifySuccess = false) {
    const copied = await copyToClipboard(buildCredentialsMessage(credentials));
    setClipboardCopied(copied);

    if (!copied) {
      onFeedback("warning", "El acceso se creó, pero el navegador no permitió copiar el mensaje.");
    } else if (notifySuccess) {
      onFeedback("success", "Mensaje de acceso copiado al portapapeles.");
    }

    return copied;
  }

  async function submit(event) {
    event.preventDefault();
    const localPart = correo.trim().toLowerCase().replace(/@.*$/, "");

    if (!localPart || !/^[a-z0-9._-]+$/.test(localPart)) {
      onFeedback("error", "Ingresa un correo institucional válido.");
      return;
    }

    if (password.length < 8 || password.length > 128) {
      onFeedback("error", "La contraseña debe tener entre 8 y 128 caracteres.");
      return;
    }

    const credentials = {
      nombre: usuario.nombre,
      correo: `${localPart}${DOMAIN}`,
      password,
    };
    const result = await onSubmit({
      integranteId: usuario.integrante_id,
      correo: credentials.correo,
      password: credentials.password,
      enviarCorreo: false,
    });

    if (!result?.success) {
      return;
    }

    setCreated(credentials);
    await copyCreatedMessage(credentials);
    showResult();
  }

  function closeForm(value) {
    if (loading) return;
    if (!value) closeAll();
  }

  async function retryCopy() {
    if (!created) return;
    await copyCreatedMessage(created, true);
  }

  const initials = String(usuario?.nombre || "U")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <>
      <Dialog open={open && primaryOpen} onOpenChange={closeForm}>
        <DialogContent
          showCloseButton={!loading}
          className="overflow-hidden p-0 duration-300 sm:max-w-xl"
          overlayClassName="bg-slate-950/45 backdrop-blur-[2px] duration-300"
          closeClassName="text-white/75 hover:bg-white/10 hover:text-white focus:ring-white/70"
        >
          <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#173C28] via-[#214D34] to-[#2D6543] px-6 py-6 text-white">
            <div className="absolute -top-16 -right-12 h-40 w-40 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 left-16 h-36 w-36 rounded-full bg-emerald-200/5" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
                <KeyRound className="h-6 w-6" strokeWidth={1.7} />
              </div>
              <div className="min-w-0 pr-6">
                <DialogTitle className="text-xl text-white">Configurar acceso</DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-5 text-emerald-50/80">
                  Crea las credenciales temporales que usará para ingresar a Sembria.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={submit}>
            <div className="space-y-5 bg-slate-50/70 px-6 py-6">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{usuario?.nombre}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Nuevo usuario con acceso institucional</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-slate-800">Datos de ingreso</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="usuario-correo" className="text-xs font-semibold text-slate-600">
                      Correo institucional
                    </label>
                    <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white transition-[border-color,box-shadow] focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/10">
                      <div className="flex items-center pl-3 text-slate-400">
                        <AtSign className="h-4 w-4" />
                      </div>
                      <Input
                        id="usuario-correo"
                        value={correo}
                        onChange={(event) => {
                          setCorreo(event.target.value.replace(/@.*$/, "").replace(/\s/g, ""));
                        }}
                        className="h-11 rounded-none border-0 px-2 shadow-none focus-visible:ring-0"
                        disabled={loading}
                      />
                      <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-500">
                        {DOMAIN}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="usuario-password" className="text-xs font-semibold text-slate-600">
                      Contraseña temporal
                    </label>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="usuario-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);
                          }}
                          className="h-11 rounded-xl border-slate-300 pr-10 pl-9 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/10"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setPassword(randomPassword());
                          setShowPassword(true);
                        }}
                        disabled={loading}
                        className="h-11 rounded-xl border-slate-300 bg-white px-3 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span className="hidden sm:inline">Generar</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                <p className="text-xs leading-5 text-emerald-800">
                  Al crear el acceso, el mensaje de bienvenida se copiará automáticamente al portapapeles.
                </p>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 bg-white px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeForm(false)}
                disabled={loading}
                className="rounded-xl border-slate-300"
              >
                Cancelar
              </Button>
              <ActionButton
                action="credentials"
                type="submit"
                loading={loading}
                loadingText="Configurando..."
              >
                Crear acceso
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
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm ring-8 ${
                  clipboardCopied
                    ? "bg-emerald-600 text-white ring-emerald-50"
                    : "bg-amber-100 text-amber-700 ring-amber-50"
                }`}
              >
                {clipboardCopied ? (
                  <ClipboardCheck className="h-8 w-8" strokeWidth={1.8} />
                ) : (
                  <Copy className="h-8 w-8" strokeWidth={1.8} />
                )}
              </div>

              <DialogHeader className="mt-6 items-center text-center sm:text-center">
                <DialogTitle className="text-xl">
                  {clipboardCopied
                    ? "Mensaje copiado al portapapeles"
                    : "Acceso creado correctamente"}
                </DialogTitle>
                <DialogDescription className="max-w-sm text-sm leading-6 text-slate-500">
                  {clipboardCopied
                    ? `Se copió el mensaje que debes enviar a ${usuario?.nombre} para que pueda acceder a su cuenta.`
                    : "El navegador no permitió copiar automáticamente. Puedes hacerlo con el botón inferior."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Destinatario</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700">{usuario?.nombre}</p>
              </div>

              {!clipboardCopied && (
                <Button
                  type="button"
                  onClick={retryCopy}
                  className="mt-6 rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
                >
                  <Copy className="h-4 w-4" />
                  Copiar mensaje
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
