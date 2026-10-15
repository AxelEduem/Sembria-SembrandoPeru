import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { changeTemporaryPassword } from "@/services/authService";
import { getPasswordUpdateErrorMessage } from "@/utils/authErrorMessages";

function CambiarPassword() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false); // Nuevo estado para controlar actualización

  // ============================================================
  // VALIDAR ACCESO
  // ============================================================

  useEffect(() => {
    // Si está actualizando, no ejecutar la redirección
    if (isUpdating) {
      return;
    }

    if (!profile) {
      return;
    }

    // Si no debe cambiar contraseña, redirigir
    if (!profile.must_change_password) {
      if (profile.avatar_path) {
        navigate("/inicio", {
          replace: true,
        });
      } else {
        navigate("/foto-perfil", {
          replace: true,
        });
      }
    }
  }, [profile, navigate, isUpdating]);

  // ============================================================
  // CAMBIO DE CONTRASEÑA
  // ============================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password.length > 128) {
      setError("La contraseña no puede superar los 128 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setIsUpdating(true); // Bloquear redirección mientras se actualiza

    try {
      await changeTemporaryPassword(password, confirmPassword);

      // ========================================================
      // 1. ACTUALIZAR PERFIL EN CONTEXT
      // ========================================================

      // Esperar explícitamente a que el perfil se actualice
      const updatedProfile = await refreshProfile();

      // Pequeña pausa para asegurar que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ========================================================
      // 2. LIMPIAR FORMULARIO
      // ========================================================

      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);

      // ========================================================
      // 3. DETERMINAR DESTINO
      // ========================================================

      if (updatedProfile?.avatar_path) {
        navigate("/inicio", {
          replace: true,
        });
        return;
      }

      navigate("/foto-perfil", {
        replace: true,
      });
    } catch (unexpectedError) {
      console.error("Error inesperado cambiando contraseña:", unexpectedError);
      setError(unexpectedError?.message || getPasswordUpdateErrorMessage(unexpectedError));
      setIsUpdating(false);
    } finally {
      setLoading(false);
      setIsUpdating(false); // Desbloquear redirección
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="module-page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* ====================================================
            CABECERA
        ===================================================== */}

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
            <KeyRound className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              Cambiar contraseña
            </h1>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Define tu contraseña personal para continuar.
            </p>
          </div>
        </div>

        {/* ====================================================
            FORMULARIO
        ===================================================== */}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ==================================================
              NUEVA CONTRASEÑA
          =================================================== */}

          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-semibold text-slate-700">
              Nueva contraseña
            </label>

            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) {
                    setError("");
                  }
                }}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                className="h-11 rounded-xl border-slate-200 bg-slate-50 pr-11 text-sm shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-emerald-600"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.8} />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400">Usa al menos 8 caracteres.</p>
          </div>

          {/* ==================================================
              CONFIRMAR
          =================================================== */}

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">
              Confirmar contraseña
            </label>

            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (error) {
                  setError("");
                }
              }}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              className="h-11 rounded-xl border-slate-200 bg-slate-50 text-sm shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ==================================================
              BOTÓN
          =================================================== */}

          <ActionButton
            action="save"
            type="submit"
            loading={loading}
            loadingText="Guardando..."
            className="h-11 w-full"
          >
            Guardar contraseña
          </ActionButton>
        </form>
      </section>
    </main>
  );
}

export default CambiarPassword;
