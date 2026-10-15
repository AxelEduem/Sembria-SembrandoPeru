import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function getDisplayError(error, fallback) {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (error && typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
}

function LoginForm() {
  const navigate = useNavigate();
  const { login, logout, authError, clearAuthError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Ingresa tu correo electrónico.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    if (!password) {
      setError("Ingresa tu contraseña.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(normalizedEmail, password);

      if (!result?.success) {
        setError(getDisplayError(result?.error, "Correo o contraseña incorrectos."));
        return;
      }

      const profile = result.profile;

      if (profile?.must_change_password) {
        // La contraseña temporal expira tras 24h. Si ya expiró, no permitir el
        // cambio: se cierra la sesión y se pide nuevas credenciales al admin.
        const expiraEn = profile?.persona?.password_temporal_expira_en;

        if (expiraEn && new Date(expiraEn).getTime() < Date.now()) {
          setError(
            "Tu contraseña temporal ha expirado. Solicita nuevas credenciales a tu administrador.",
          );
          await logout().catch(() => {});
          return;
        }

        navigate("/cambiar-password", {
          replace: true,
        });

        return;
      }

      if (!profile?.avatar_path) {
        navigate("/foto-perfil", {
          replace: true,
        });

        return;
      }

      navigate("/inicio", {
        replace: true,
      });
    } catch (error) {
      console.error("Error durante el login:", error);

      setError(getDisplayError(error, "Ocurrió un error inesperado. Intenta nuevamente."));
    } finally {
      setLoading(false);
    }
  }

  function togglePasswordVisibility() {
    setShowPassword((previous) => !previous);
  }

  return (
    <section className="relative flex min-h-[54%] w-full items-center justify-center bg-white px-6 py-8 sm:px-10 sm:py-10 lg:h-full lg:w-[44%] lg:px-12 lg:py-0 xl:px-16 max-sm:min-h-0 max-sm:px-5 max-sm:pt-7 max-sm:pb-[calc(1.75rem+env(safe-area-inset-bottom))] sm:max-lg:min-h-[58%]">
      <div className="w-full max-w-[430px]">
        <header className="mb-8 sm:mb-9 max-sm:mb-6">
          <div className="mb-3.5 flex items-center gap-2.5 max-sm:hidden">
            <span className="block h-4 w-1 rounded-full bg-emerald-500" />

            <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-600 uppercase sm:text-xs">
              Acceso institucional
            </p>
          </div>

          <h1 className="text-[2rem] leading-tight font-bold tracking-tight text-slate-900 sm:text-[2.25rem] max-sm:text-[1.85rem]">
            Bienvenido
          </h1>

          <p className="mt-2.5 max-w-sm text-base leading-6 text-slate-500 max-sm:text-[15px] max-sm:leading-5">
            Ingresa tus credenciales para acceder al sistema.
          </p>
        </header>

        <form onSubmit={handleLogin} noValidate className="space-y-5 max-sm:space-y-3.5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg
                  className="h-[17px] w-[17px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6" />
                </svg>
              </div>

              <input
                id="email"
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                  clearAuthError();
                }}
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-4 pl-11 text-base text-slate-900 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <svg
                  className="h-[17px] w-[17px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              </div>

              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError("");
                  clearAuthError();
                }}
                autoComplete="current-password"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-12 pl-11 text-base text-slate-900 transition-all duration-200 outline-none placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              <button
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-0 flex w-12 cursor-pointer items-center justify-center text-slate-400 transition-colors hover:text-emerald-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
                    />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                ) : (
                  <svg
                    className="h-[18px] w-[18px]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.6 10.6a2 2 0 002.8 2.8"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.9 5.2A10.7 10.7 0 0112 5c6 0 9.5 7 9.5 7a17.5 17.5 0 01-3.1 3.9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.1 6.1C3.8 7.7 2.5 10.1 2.5 12c0 0 3.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {(error || authError) && (
            <div
              className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <svg
                className="h-4 w-4 shrink-0 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M12 8v4" />
                <path strokeLinecap="round" d="M12 16h.01" />
              </svg>

              <p className="text-xs text-red-700">{error || authError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group h-12 w-full rounded-xl bg-emerald-600 text-base font-semibold text-white shadow-md shadow-emerald-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 focus:ring-4 focus:ring-emerald-500/20 focus:outline-none active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-80"
                    fill="currentColor"
                    d="M21 12a9 9 0 00-9-9v3a6 6 0 016 6h3z"
                  />
                </svg>
                Ingresando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Iniciar sesión
                <svg
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 6l6 6-6 6" />
                </svg>
              </span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center max-sm:mt-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-600/60 uppercase">
            Gestiona · Organiza · Transforma
          </p>
        </div>

        <footer className="mt-8 border-t border-slate-100 pt-6 max-sm:mt-5 max-sm:pt-4">
          <p className="text-center text-xs text-slate-400">
            Acceso exclusivo para personal autorizado
          </p>

          <p className="mt-1 text-center text-[10px] text-slate-400">
            © {new Date().getFullYear()} Sembrando Perú
          </p>

          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            Desarrollado por{" "}
            <a
              href="https://axeledu.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-500 underline-offset-2 transition-colors hover:text-emerald-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            >
              Axel Eduardo
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href="https://github.com/AxelEduem"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-500 underline-offset-2 transition-colors hover:text-emerald-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </section>
  );
}

export default LoginForm;
