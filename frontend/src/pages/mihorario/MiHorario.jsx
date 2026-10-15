import { useEffect, useMemo, useState } from "react";
import { CalendarClock, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ManualButton from "@/components/ui/ManualButton";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { useMiHorario } from "@/hooks/useMiHorario";
import { useScheduleChangeEligibility } from "@/hooks/useScheduleChangeEligibility";
import MiHorarioSummary from "@/components/mihorario/MiHorarioSummary";
import MiHorarioGrid from "@/components/mihorario/MiHorarioGrid";

function MiHorario() {
  const { loading, error, horarios, setError } = useMiHorario();
  const {
    eligibility,
    loading: eligibilityLoading,
    error: eligibilityError,
  } = useScheduleChangeEligibility();
  const location = useLocation();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState(() => {
    if (location.state?.feedback) return location.state.feedback;
    if (location.state?.notice) {
      return { type: "success", message: location.state.notice };
    }
    return null;
  });

  useEffect(() => {
    if (location.state?.feedback || location.state?.notice) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const scheduleChangeBlocked =
    eligibilityLoading || Boolean(eligibilityError) || !eligibility.canCreate;

  function handleScheduleChange() {
    if (eligibilityLoading) {
      setFeedback({
        type: "warning",
        message: "Estamos verificando si puedes solicitar un cambio de horario.",
      });
      return;
    }

    if (eligibilityError) {
      setFeedback({ type: "error", message: eligibilityError });
      return;
    }

    if (!eligibility.canCreate) {
      setFeedback({
        type: "warning",
        message: eligibility.message || "No puedes solicitar otro cambio de horario por el momento.",
      });
      return;
    }

    navigate("/cambiar-horario/nuevo");
  }

  const totalHoras = useMemo(() => {
    return (horarios || []).reduce((total, item) => {
      const start = item?.hora_inicio || "00:00";
      const end = item?.hora_fin || "00:00";

      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);

      if (
        Number.isNaN(sh) || Number.isNaN(sm) ||
        Number.isNaN(eh) || Number.isNaN(em)
      ) {
        return total;
      }

      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      const minutes = Math.max(0, endMinutes - startMinutes);

      return total + minutes / 60;
    }, 0);
  }, [horarios]);

  return (
      <div className="module-page-enter pb-8">
        <FeedbackToast
          feedback={error ? { type: "error", message: error } : feedback}
          onClose={() => {
            setError("");
            setFeedback(null);
          }}
        />
        {loading ? (
          <MiHorarioLoading />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <ManualButton to="/mi-horario/manual" />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/mi-horario/historial")}
                  className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <History className="h-4 w-4" strokeWidth={1.8} />
                  Historial de horario
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/cambiar-horario")}
                  className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <History className="h-4 w-4" strokeWidth={1.8} />
                  Historial de solicitudes
                </Button>

                <Button
                  type="button"
                  aria-disabled={scheduleChangeBlocked}
                  onClick={handleScheduleChange}
                  className={`h-10 gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm ${
                    scheduleChangeBlocked
                      ? "cursor-not-allowed bg-slate-200 text-slate-500 hover:bg-slate-200"
                      : "bg-[#2D5A3D] text-white hover:bg-[#234B32]"
                  }`}
                >
                  <CalendarClock className="h-4 w-4" strokeWidth={1.8} />
                  Cambiar horario
                </Button>
              </div>

              <MiHorarioSummary totalHoras={totalHoras} />
            </div>

            {!horarios.length ? (
              <div className="pt-2">
                <MiHorarioEmpty />
              </div>
            ) : (
              <div className="pt-1">
                <MiHorarioGrid horarios={horarios} totalHoras={totalHoras} />
              </div>
            )}
          </div>
        )}
      </div>
  );
}

/* ===========================================================
   LOADING
=========================================================== */

function MiHorarioLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end pt-2 pb-1">
        <div className="h-[72px] w-[220px] animate-pulse rounded-2xl bg-slate-200" />
      </div>

      <section className="mt-2 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="p-5">
          <div className="h-[560px] animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </section>
    </div>
  );
}

/* ===========================================================
   ESTADO VACÍO
=========================================================== */

function MiHorarioEmpty() {
  return (
    <section className="rounded-[24px] border border-dashed border-slate-200 bg-white px-5 py-12 text-center shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
      </div>

      <h2 className="mt-4 text-sm font-semibold text-slate-800">
        No hay horario registrado
      </h2>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
        Actualmente no tienes un horario establecido para tu jornada.
      </p>
    </section>
  );
}

export default MiHorario;
