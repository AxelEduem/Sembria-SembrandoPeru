import { Check, UserRound } from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";

import PerfilAvatar from "./PerfilAvatar";
import PerfilInformacion from "./PerfilInformacion";

function PerfilAdministracion({
  profile,
  user,
  area,
  loadingAreas,
  nombres,
  apellidos,
  selectedPhoto,
  photoPreview,
  saving,
  error,
  feedback,
  onNombresChange,
  onApellidosChange,
  onPhotoChange,
  onSave,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
        <div className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />

          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900">
              Mi perfil
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Información principal de la cuenta con acceso administrativo.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONTENIDO
      ====================================================== */}

      <div className="px-5 py-6 sm:px-7">
        {feedback && (
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            <Check className="h-4 w-4" strokeWidth={2} />

            {feedback}
          </div>
        )}

        <div className="flex flex-col gap-7 lg:flex-row">
          <PerfilAvatar
            profile={profile}
            nombres={nombres}
            apellidos={apellidos}
            photoPreview={photoPreview}
            selectedPhoto={selectedPhoto}
            saving={saving}
            onPhotoChange={onPhotoChange}
          />

          <PerfilInformacion
            profile={profile}
            user={user}
            area={area}
            loadingAreas={loadingAreas}
            nombres={nombres}
            apellidos={apellidos}
            onNombresChange={onNombresChange}
            onApellidosChange={onApellidosChange}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {/* ===================================================
            ACCIÓN PRINCIPAL
        ================================================== */}

        <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <ActionButton
            action="save"
            type="button"
            onClick={onSave}
            loading={saving}
            loadingText="Guardando..."
            className="w-full sm:w-auto"
          >
            Guardar cambios
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

export default PerfilAdministracion;
