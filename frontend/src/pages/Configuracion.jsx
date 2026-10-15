import { useEffect, useMemo, useRef, useState } from "react";

import DetailHeader from "@/components/integrantes/detail/DetailHeader";
import MainInfoSection from "@/components/integrantes/detail/MainInfoSection";
import PeriodSection from "@/components/integrantes/detail/PeriodSection";
import ScheduleSection from "@/components/integrantes/detail/ScheduleSection";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { IntegranteDetailDataProvider } from "@/contexts/IntegranteDetailContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMiHorario } from "@/hooks/useMiHorario";
import { uploadAvatar } from "@/services/avatarService";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function Configuracion() {
  const { refreshProfile } = useAuth();
  const { integrante, horarios, loading, error, setError, refresh } = useMiHorario();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const previewUrlRef = useRef("");

  const currentHistory = integrante?.historial_actual || integrante?.historiales?.[0] || null;
  const tipoIntegrante = currentHistory?.tipo_integrante || "voluntario";

  const detail = useMemo(
    () => ({
      loading,
      error,
      clearError: () => setError(""),
      row: integrante,
      history: integrante?.historiales || [],
      horarios,
      isPracticante: tipoIntegrante === "practicante",
      tipoIntegrante,
      currentHistory,
      departamento: integrante?.departamento || "",
      ciudad: integrante?.ciudad || "",
      distrito: integrante?.distrito || "",
    }),
    [currentHistory, error, horarios, integrante, loading, setError, tipoIntegrante],
  );

  function clearPreview() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }

    setPhotoPreview("");
  }

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    let message = "";
    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      message = "Selecciona una imagen JPG, PNG o WebP.";
    } else if (file.size > MAX_PHOTO_SIZE) {
      message = "La imagen debe pesar como máximo 2 MB.";
    }

    if (message) {
      setSelectedPhoto(null);
      clearPreview();
      setFeedback({ type: "error", message });
      event.target.value = "";
      return;
    }

    clearPreview();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPhotoPreview(previewUrl);
    setSelectedPhoto(file);
    setFeedback(null);
  }

  async function handleSavePhoto() {
    if (!selectedPhoto || savingPhoto) return;

    setSavingPhoto(true);
    setFeedback(null);

    try {
      await uploadAvatar(selectedPhoto);
      await refreshProfile();
      await refresh(true);
      setSelectedPhoto(null);
      clearPreview();
      setFeedback({ type: "success", message: "Foto de perfil actualizada correctamente." });
    } catch (unexpectedError) {
      setFeedback({
        type: "error",
        message: unexpectedError?.message || "No se pudo actualizar la foto de perfil.",
      });
    } finally {
      setSavingPhoto(false);
    }
  }

  if (error) {
    return (
      <>
        <div className="module-page-enter mx-auto max-w-6xl pb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No fue posible mostrar la información de tu perfil.
          </div>
        </div>
        <FeedbackToast
          feedback={{ type: "error", message: error }}
          onClose={() => setError("")}
        />
      </>
    );
  }

  if (loading || !integrante) {
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <IntegranteDetailDataProvider value={detail}>
      <div className="module-page-enter mx-auto max-w-6xl space-y-5 pb-8">
        <DetailHeader
          showBackButton={false}
          photoPreview={photoPreview}
          selectedPhoto={selectedPhoto}
          savingPhoto={savingPhoto}
          onPhotoChange={handlePhotoChange}
          onSavePhoto={handleSavePhoto}
        />
        <MainInfoSection />
        <PeriodSection />

        {tipoIntegrante !== "gerente" && (
          <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
            <ScheduleSection personal />
          </section>
        )}
      </div>

      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </IntegranteDetailDataProvider>
  );
}

export default Configuracion;
