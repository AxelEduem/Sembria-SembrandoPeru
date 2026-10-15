import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/contexts/ToastContext";
import { changePassword } from "@/services/authService";

function Seguridad() {
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft === 0) return undefined;
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || secondsLeft > 0) return;

    if (currentPassword.trim() === "") {
      return showToast({
        type: "error",
        message: "Ingrese su contraseña actual.",
      });
    }

    if (password.length < 8) {
      return showToast({
        type: "error",
        message: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    if (password.length > 72) {
      return showToast({
        type: "error",
        message: "La contraseña no puede exceder los 72 caracteres.",
      });
    }

    if (password !== confirmation) {
      return showToast({
        type: "error",
        message: "Las contraseñas no coinciden.",
      });
    }

    if (password === currentPassword) {
      return showToast({
        type: "error",
        message: "La nueva contraseña debe ser diferente a la actual.",
      });
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, password, confirmation);

      showToast({
        type: "success",
        message:
          "Contraseña actualizada. Inicia sesión con tu nueva contraseña.",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      if (error?.status === 429) {
        setSecondsLeft(60);
        showToast({
          type: "error",
          message:
            "Demasiados intentos. Espera unos minutos antes de reintentar.",
        });
      } else {
        showToast({
          type: "error",
          message: error?.message || "No se pudo actualizar la contraseña.",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const isRateLimited = secondsLeft > 0;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center py-6">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-7">
          <div className="space-y-2">
            <label
              htmlFor="security-current-password"
              className="text-sm font-semibold text-slate-700"
            >
              Contraseña actual
            </label>
            <div className="relative">
              <Input
                id="security-current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((value) => !value)}
                aria-label={
                  showCurrent ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-emerald-600"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Ingrese su contraseña actual.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="security-new-password"
              className="text-sm font-semibold text-slate-700"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                id="security-new-password"
                type={visible ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-11"
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-emerald-600"
              >
                {visible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400">Usa al menos 8 caracteres.</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="security-confirm-password"
              className="text-sm font-semibold text-slate-700"
            >
              Confirmar contraseña
            </label>
            <Input
              id="security-confirm-password"
              type={visible ? "text" : "password"}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              className="h-11 rounded-xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link
              to="/perfil-administracion"
              className="flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-slate-500 hover:text-emerald-700"
            >
              Cancelar
            </Link>
            <ActionButton
              action="save"
              type="submit"
              loading={saving}
              loadingText="Guardando..."
              disabled={isRateLimited}
              className="h-11"
            >
              {isRateLimited ? `Reintentar en ${secondsLeft}s` : "Actualizar contraseña"}
            </ActionButton>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Seguridad;
