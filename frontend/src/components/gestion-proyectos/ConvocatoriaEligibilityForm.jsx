import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { inputClass } from "@/constants/formConstants";
import {
  ELIGIBILITY_CRITERIA,
  getEligibilityResult,
  getSuggestedEvaluations,
} from "@/services/gestion-proyectos/convocatoriasService";

const emptyEvaluation = (codigo) => ({
  criterio_codigo: codigo,
  estado_revision: "pendiente",
  observacion: "",
});
export default function ConvocatoriaEligibilityForm({
  convocatoria,
  evaluaciones: initialEvaluaciones = [],
  mode = "primer_filtro",
  saving,
  canEvaluate,
  showResultSummary = true,
  onSave,
  onCancel,
}) {
  const [evaluaciones, setEvaluaciones] = useState(() =>
    ELIGIBILITY_CRITERIA.map(
      (criterion) =>
        initialEvaluaciones.find((item) => item.criterio_codigo === criterion.codigo) ||
        emptyEvaluation(criterion.codigo),
    ),
  );
  const [error, setError] = useState("");
  const isSegundoFiltro = mode === "segundo_filtro";
  const suggested = useMemo(
    () => getSuggestedEvaluations(convocatoria, evaluaciones),
    [convocatoria, evaluaciones],
  );
  const result = getEligibilityResult(suggested);
  const label = {
    elegible: "Elegible",
    no_viable: "No viable",
    pendiente_revision: "Pendiente de revisión",
  }[result];
  const completedCount = suggested.filter((item) => item.estado_revision !== "pendiente").length;
  const passedCount = suggested.filter((item) => item.estado_revision === "cumple").length;
  const failedCount = suggested.filter((item) => item.estado_revision === "no_cumple").length;
  const pendingCount = ELIGIBILITY_CRITERIA.length - completedCount;
  const completion = Math.round((completedCount / ELIGIBILITY_CRITERIA.length) * 100);
  function update(codigo, key, value) {
    setEvaluaciones((items) =>
      items.map((item) => (item.criterio_codigo === codigo ? { ...item, [key]: value } : item)),
    );
  }
  function submit(event) {
    event.preventDefault();
    if (!canEvaluate)
      return setError(
        `No tienes permiso para realizar el ${isSegundoFiltro ? "segundo" : "primer"} filtro.`,
      );
    onSave(suggested);
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-emerald-50/60 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {isSegundoFiltro ? "Segundo filtro de convocatoria" : "Evaluación de elegibilidad"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
                  {isSegundoFiltro
                    ? "Confirma con mayor detalle si la convocatoria cumple cada criterio antes de la aprobación."
                    : "Evalúa los ocho criterios para determinar si la convocatoria puede avanzar."}
                </p>
              </div>
            </div>
            <div className="min-w-44 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-4 text-xs">
                <span className="font-medium text-slate-500">Avance</span>
                <span className="font-bold text-slate-800">{completedCount}/8</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#2D5A3D] transition-all duration-300"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cumplió: {passedCount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <XCircle className="h-3.5 w-3.5" />
              No cumplió: {failedCount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              Pendiente: {pendingCount}
            </span>
          </div>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          {ELIGIBILITY_CRITERIA.map((criterion, index) => {
            const item = suggested.find(
              (evaluation) => evaluation.criterio_codigo === criterion.codigo,
            );
            const passed = item.estado_revision === "cumple";
            const failed = item.estado_revision === "no_cumple";
            const statusStyle = passed
              ? {
                  card: "border-emerald-200 bg-emerald-50/45",
                  number: "bg-emerald-600 text-white",
                  select: "border-emerald-300 bg-white text-emerald-800 focus:border-emerald-500 focus:ring-emerald-100",
                  label: "Cumplió",
                  icon: CheckCircle2,
                  iconColor: "text-emerald-600",
                }
              : failed
                ? {
                    card: "border-red-200 bg-red-50/45",
                    number: "bg-red-600 text-white",
                    select: "border-red-300 bg-white text-red-800 focus:border-red-500 focus:ring-red-100",
                    label: "No cumplió",
                    icon: XCircle,
                    iconColor: "text-red-600",
                  }
                : {
                    card: "border-slate-200 bg-white",
                    number: "bg-slate-100 text-slate-600",
                    select: "border-amber-200 bg-white text-amber-800 focus:border-amber-400 focus:ring-amber-100",
                    label: "Pendiente",
                    icon: Clock3,
                    iconColor: "text-amber-500",
                  };
            const StatusIcon = statusStyle.icon;
            return (
              <article
                key={criterion.codigo}
                className={`rounded-2xl border p-4 transition-all duration-200 ${statusStyle.card}`}
              >
                <div className="grid gap-4 md:grid-cols-[1fr_210px] md:items-center">
                  <div className="flex items-start gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${statusStyle.number}`}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-800">{criterion.nombre}</p>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${statusStyle.iconColor}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {criterion.descripcion}
                      </p>
                    </div>
                  </div>
                  <select
                    className={`h-11 w-full cursor-pointer rounded-xl border px-3 text-sm font-semibold outline-none transition-colors focus:ring-2 ${statusStyle.select}`}
                    disabled={saving || !canEvaluate}
                    value={item.estado_revision}
                    onChange={(event) =>
                      update(criterion.codigo, "estado_revision", event.target.value)
                    }
                  >
                    <option value="pendiente">Pendiente de revisión</option>
                    <option value="cumple">Cumple</option>
                    <option value="no_cumple">No cumple</option>
                  </select>
                </div>
                <Input
                  className={`${inputClass} mt-4 border-slate-200 bg-white/90`}
                  disabled={saving || !canEvaluate}
                  value={item.observacion || ""}
                  placeholder="Observación o justificación"
                  onChange={(event) => update(criterion.codigo, "observacion", event.target.value)}
                />
              </article>
            );
          })}
        </div>
      </section>
      <section
        className={
          showResultSummary
            ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            : "py-1"
        }
      >
        {showResultSummary && (
          <>
            <p className="text-sm font-semibold text-slate-700">Resultado de evaluación</p>
            <p
              className={`mt-1 text-lg font-bold ${result === "no_viable" ? "text-red-700" : result === "elegible" ? "text-emerald-700" : "text-amber-700"}`}
            >
              {label}
            </p>
          </>
        )}
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <ActionButton
            action="save"
            type="submit"
            loading={saving}
            loadingText="Guardando..."
            disabled={!canEvaluate}
          >
            Guardar evaluación
          </ActionButton>
        </div>
      </section>
    </form>
  );
}
