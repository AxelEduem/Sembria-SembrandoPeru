import {
  IntegranteDetailProvider,
  useIntegranteDetailContext,
} from "@/contexts/IntegranteDetailContext";
import DetailHeader from "@/components/integrantes/detail/DetailHeader";
import MainInfoSection from "@/components/integrantes/detail/MainInfoSection";
import PeriodSection from "@/components/integrantes/detail/PeriodSection";
import ScheduleSection from "@/components/integrantes/detail/ScheduleSection";
import FeedbackToast from "@/components/ui/FeedbackToast";

function DetailContent() {
  const { loading, error, clearError, row, tipoIntegrante } = useIntegranteDetailContext();

  if (error) {
    return (
      <>
        <div className="module-page-enter mx-auto max-w-6xl pb-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            No fue posible mostrar la información solicitada.
          </div>
        </div>
        <FeedbackToast feedback={{ type: "error", message: error }} onClose={clearError} />
      </>
    );
  }

  if (loading || !row) {
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-600">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter mx-auto max-w-6xl space-y-5 pb-8">
      <DetailHeader />
      <MainInfoSection />

      <PeriodSection />

      {tipoIntegrante !== "gerente" && (
        <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <ScheduleSection />
          {/* Aquí puedes mantener el bloque de aplicaciones si existe */}
        </section>
      )}
    </div>
  );
}

export default function IntegranteDetailPage() {
  return (
    <IntegranteDetailProvider>
      <DetailContent />
    </IntegranteDetailProvider>
  );
}
