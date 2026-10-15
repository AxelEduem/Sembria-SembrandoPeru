import { Navigate } from "react-router-dom";

import LoginBrandPanel from "../../components/login/LoginBrandPanel";
import LoginForm from "../../components/login/LoginForm";

import { useAuth } from "../../contexts/AuthContext";

function Login() {
  const { isAuthenticated, loading, profile } = useAuth();

  if (loading) {
    return (
      <main className="fixed inset-0 flex h-full w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

          <p className="text-sm text-slate-500">Verificando sesión...</p>
        </div>
      </main>
    );
  }

  if (isAuthenticated && profile) {
    if (profile.must_change_password) {
      return <Navigate to="/cambiar-password" replace />;
    }

    if (!profile.avatar_path) {
      return <Navigate to="/foto-perfil" replace />;
    }

    return <Navigate to="/inicio" replace />;
  }

  return (
    <main className="fixed inset-0 h-full w-full overflow-y-auto bg-white lg:overflow-hidden max-lg:static max-lg:h-auto max-lg:min-h-[100dvh] max-lg:pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full w-full flex-col lg:flex-row max-lg:h-auto max-lg:min-h-[100dvh]">
        <LoginBrandPanel />

        <LoginForm />
      </div>
    </main>
  );
}

export default Login;
