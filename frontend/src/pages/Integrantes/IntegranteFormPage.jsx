import { useMemo } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";

import { IntegranteFormProvider, useIntegranteFormContext } from "@/contexts/IntegranteFormContext";

import IntegranteFormContent from "@/components/integrantes/form/IntegranteFormContent";
import IntegranteFormSchedule from "@/components/integrantes/form/IntegranteFormSchedule";
import IntegranteFormDraftBanner from "@/components/integrantes/form/IntegranteFormDraftBanner";
import FeedbackToast from "@/components/ui/FeedbackToast";

function IntegranteFormPageContent() {
  const {
    navigate,
    listPath,
    submit,
    submitting,
    loadingRecord,
    mode,
    draftData,
    applyDraft,
    dismissDraft,
    selectedType,
    formError,
    setFormError,
  } = useIntegranteFormContext();

  const errorFeedback = useMemo(
    () => (formError ? { type: "error", message: formError } : null),
    [formError],
  );

  if (loadingRecord) {
    return (
      <div className="mx-auto max-w-6xl pb-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />

          <div className="p-10 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#2D5A3D]" />

            <p className="text-sm font-semibold text-slate-700">Cargando integrante</p>

            <p className="mt-1 text-xs text-slate-400">Preparando información del integrante...</p>
          </div>
        </div>
      </div>
    );
  }

  const isEdit = mode === "edit";

  return (
    <>
      {/* Encabezado */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(listPath)}
          disabled={submitting}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a integrantes
        </button>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />

          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                  <UserPlus className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                      Integrantes
                    </span>

                    {isEdit && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Edición
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {isEdit ? "Editar integrante" : "Registrar nuevo integrante"}
                  </h1>

                  <p className="mt-1 text-sm leading-5 text-slate-500">
                    {isEdit
                      ? "Actualiza la información del integrante y sus datos de participación."
                      : "Completa la información necesaria para registrar un nuevo integrante."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso de borrador guardado */}
      {draftData && (
        <div className="mb-5">
          <IntegranteFormDraftBanner onContinue={applyDraft} onDismiss={dismissDraft} />
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={submit} className="space-y-5">
        <IntegranteFormContent />

        {(isEdit || selectedType) && (
          <div
            key={`schedule-${selectedType || "edit"}`}
            className="integrante-form-fields-enter"
            data-integrante-type={selectedType || undefined}
          >
            <IntegranteFormSchedule />
          </div>
        )}
      </form>

      <FeedbackToast feedback={errorFeedback} onClose={() => setFormError("")} />
    </>
  );
}

export default function IntegranteFormPage({ mode }) {
  return (
    <IntegranteFormProvider mode={mode}>
      <div className="module-page-enter mx-auto max-w-6xl pb-10">
        <IntegranteFormPageContent />
      </div>
    </IntegranteFormProvider>
  );
}
