import { useEffect } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import FotoPerfilHeader from "@/components/foto-perfil/FotoPerfilHeader";
import FotoPerfilForm from "@/components/foto-perfil/FotoPerfilForm";

function FotoPerfil() {
  const navigate = useNavigate();

  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || !profile) {
      navigate("/", {
        replace: true,
      });

      return;
    }

    if (profile.must_change_password) {
      navigate("/cambiar-password", {
        replace: true,
      });

      return;
    }

    if (profile.avatar_path) {
      navigate("/inicio", {
        replace: true,
      });
    }
  }, [authLoading, user, profile, navigate]);

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="module-page-enter w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <FotoPerfilHeader />

        <FotoPerfilForm
          user={user}
          refreshProfile={refreshProfile}
          onSuccess={() =>
            navigate("/inicio", {
              replace: true,
            })
          }
        />
      </section>
    </main>
  );
}

export default FotoPerfil;
