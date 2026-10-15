import { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { useNavigate } from "react-router-dom";

import IntegranteFormSchedule from "@/components/integrantes/form/IntegranteFormSchedule";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { Button } from "@/components/ui/button";
import useHorarios from "@/hooks/useHorarios";
import { useMiHorario } from "@/hooks/useMiHorario";
import { useScheduleChangeEligibility } from "@/hooks/useScheduleChangeEligibility";
import { crearSolicitudCambioHorario } from "@/services/solicitudes-cambio-horario/solicitudesCambioHorarioService";

const minEffectiveDate = new Date(Date.now() + 86400000)
  .toISOString()
  .slice(0, 10);

export default function SolicitarCambioHorarioNuevo() {
  const navigate = useNavigate();
  const {
    eligibility,
    loading: checkingEligibility,
    error: eligibilityError,
  } = useScheduleChangeEligibility();

  const {
    integrante,
    horarios: actual,
    loading,
  } = useMiHorario();

  const horariosState = useHorarios();

  const [fechaEfectiva, setFechaEfectiva] = useState(minEffectiveDate);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (checkingEligibility || eligibilityError || eligibility.canCreate) return;

    navigate("/mi-horario", {
      replace: true,
      state: {
        feedback: {
          type: "warning",
          message:
            eligibility.message ||
            "No puedes solicitar otro cambio de horario por el momento.",
        },
      },
    });
  }, [checkingEligibility, eligibility, eligibilityError, navigate]);

  const submit = async () => {
    setSubmitting(true);
    setError("");

    try {
      await crearSolicitudCambioHorario({
        fechaEfectiva,
        motivo,
        bloques: horariosState.horarios,
      });

      navigate("/mi-horario", {
        state: {
          feedback: {
            type: "success",
            message: "Solicitud de cambio de horario enviada correctamente.",
          },
        },
      });
    } catch (submitError) {
      setError(submitError?.message || "No se pudo enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || checkingEligibility) {
    return (
      <div className="module-page-enter pb-8">
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-slate-500">Cargando horario...</p>
        </div>
      </div>
    );
  }

  if (eligibilityError) {
    return (
      <div className="module-page-enter pb-8">
        <FeedbackToast
          feedback={{ type: "error", message: eligibilityError }}
        />
        <section className="rounded-3xl border border-slate-200 bg-white px-5 py-12 text-center">
          <h2 className="text-sm font-semibold text-slate-800">
            No se pudo verificar tu solicitud
          </h2>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => navigate("/mi-horario")}
          >
            Volver a mi horario
          </Button>
        </section>
      </div>
    );
  }

  if (!eligibility.canCreate) {
    return (
      <div className="module-page-enter flex items-center justify-center py-16">
        <p className="text-sm text-slate-500">Volviendo a tu horario...</p>
      </div>
    );
  }

  if (!integrante || !actual.length) {
    return (
      <div className="module-page-enter pb-8">
        <section className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <div className="h-6 w-6 rounded-full border-2 border-slate-300" />
          </div>

          <h2 className="mt-4 text-sm font-semibold text-slate-800">
            No tienes un horario vigente
          </h2>

          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            No puedes gestionar un cambio de horario porque actualmente no
            tienes un horario registrado.
          </p>

          <Button
            className="mt-5"
            variant="outline"
            onClick={() => navigate("/mi-horario")}
          >
            Volver a mi horario
          </Button>
        </section>
      </div>
    );
  }

  return (
    <div className="module-page-enter mx-auto max-w-6xl space-y-6 pb-8">
      <FeedbackToast
        feedback={error ? { type: "error", message: error } : null}
        onClose={() => setError("")}
      />
      <button
        type="button"
        onClick={() => navigate("/mi-horario")}
        className="inline-flex items-center gap-2 self-start rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a mi horario
      </button>

      {/* Fecha efectiva + motivo */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <CalendarClock className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Datos de la solicitud
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-500">
                Indica desde cuándo debe aplicarse el cambio y, si deseas, explica el motivo.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-[220px_1fr]">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Fecha efectiva
            </label>

            <input
              type="date"
              min={minEffectiveDate}
              value={fechaEfectiva}
              onChange={(event) => setFechaEfectiva(event.target.value)}
              className="mt-2 block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
            />

            <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
              El nuevo horario comenzará a aplicarse desde esta fecha.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Motivo del cambio
            </label>

            <textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
              placeholder="Describe brevemente el motivo (opcional)"
            />
          </div>
        </div>
      </section>

      {/* Propuesta de nuevo horario */}
      <section>
        <IntegranteFormSchedule
          value={{
            horariosState,
            submitting,
            fechaInicio: fechaEfectiva,
            fechaFin: "2099-12-31",
            mode: "request",
            onCancel: () => navigate("/mi-horario"),
            onSubmit: submit,
            submitLabel: "Enviar solicitud",
            scheduleTitle: "Nuevo horario solicitado",
            scheduleDescription:
              "Selecciona los días y bloques horarios que deseas proponer para tu nuevo horario.",
            actionDescription: "Verifica la información antes de enviar tu solicitud.",
          }}
        />
      </section>
    </div>
  );
}
