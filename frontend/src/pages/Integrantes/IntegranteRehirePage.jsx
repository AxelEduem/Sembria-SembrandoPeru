import { RehireFormProvider, useRehireFormContext } from "@/contexts/RehireFormContext";
import RehireHeader from "@/components/integrantes/rehire/RehireHeader";
import RehirePersonalSection from "@/components/integrantes/rehire/RehirePersonalSection";
import RehirePeriodSection from "@/components/integrantes/rehire/RehirePeriodSection";
import RehirePracticeSection from "@/components/integrantes/rehire/RehirePracticeSection";
import RehireScheduleSection from "@/components/integrantes/rehire/RehireScheduleSection";
import RehireActions from "@/components/integrantes/rehire/RehireActions";
import FeedbackToast from "@/components/ui/FeedbackToast";

function RehirePageContent() {
  const { loadingRecord, row, formError, clearFormError, isPracticante, submit } =
    useRehireFormContext();
  const errorFeedback = formError ? { type: "error", message: formError } : null;

  if (loadingRecord) {
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">
            Cargando información del integrante...
          </p>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <>
        <div className="module-page-enter mx-auto max-w-6xl pb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No fue posible mostrar la información solicitada.
          </div>
        </div>
        <FeedbackToast feedback={errorFeedback} onClose={clearFormError} />
      </>
    );
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    submit(event);
  };

  return (
    <div className="module-page-enter mx-auto max-w-6xl space-y-5 pb-8">
      <RehireHeader />
      <form onSubmit={handleSubmit} className="space-y-5">
        <RehirePersonalSection />
        <RehirePeriodSection />
        {isPracticante && <RehirePracticeSection />}
        <RehireScheduleSection />
        <RehireActions />
      </form>
      <FeedbackToast feedback={errorFeedback} onClose={clearFormError} />
    </div>
  );
}

export default function IntegranteRehirePage() {
  return (
    <RehireFormProvider>
      <RehirePageContent />
    </RehireFormProvider>
  );
}
