import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConvocatoriaEligibilityForm from "@/components/gestion-proyectos/ConvocatoriaEligibilityForm";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  ELIGIBILITY_CRITERIA,
  getConvocatoria,
  getEligibilityResult,
  getEvaluacionesPorFiltro,
  saveSegundoFiltro,
} from "@/services/gestion-proyectos/convocatoriasService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const resultLabels = {
  elegible: "Elegible",
  no_viable: "No viable",
  pendiente_revision: "Pendiente de revisión",
};

function reviewerName(evaluaciones) {
  const person = evaluaciones.find((item) => item.revisor?.persona)?.revisor?.persona;
  return [person?.nombres, person?.apellidos].filter(Boolean).join(" ") || "No disponible";
}

export default function ConvocatoriaSecondFilterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getConvocatoria(id, { cacheScope })
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [cacheScope, id]);
  const primerFiltro = useMemo(
    () => getEvaluacionesPorFiltro(item?.evaluaciones, "primer_filtro"),
    [item],
  );
  const segundoFiltro = useMemo(
    () => getEvaluacionesPorFiltro(item?.evaluaciones, "segundo_filtro"),
    [item],
  );
  const canReview = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_REVISAR);
  const hasPrimerFiltro = primerFiltro.length > 0;
  async function save(evaluaciones) {
    if (!hasPrimerFiltro) return setError("Primero debe completarse el primer filtro.");
    setSaving(true);
    try {
      await saveSegundoFiltro(id, evaluaciones);
      navigate(`/gestion-proyectos/detecta/convocatorias/${id}`, {
        state: { feedback: { type: "success", message: "Segundo filtro guardado correctamente." } },
      });
    } catch (e) {
      setError(e.message || "No se pudo guardar el segundo filtro.");
    } finally {
      setSaving(false);
    }
  }
  if (error) return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>;
  if (!item) return <div className="p-10 text-center">Cargando convocatoria...</div>;
  if (!canReview)
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-800">
        <LockKeyhole className="mb-3 h-5 w-5" />
        No tienes permiso para realizar el segundo filtro.
      </div>
    );
  if (!hasPrimerFiltro)
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-100 bg-amber-50 p-6 text-amber-800">
        Primero debe completarse el primer filtro.
      </div>
    );
  const primerResultado = getEligibilityResult(primerFiltro);
  return (
    <div className="module-page-enter mx-auto max-w-6xl pb-10">
      <button
        type="button"
        onClick={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a convocatoria
      </button>
      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#2D5A3D]" />
        <div className="p-6">
          <p className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
            Gestión de Proyectos · Detecta
          </p>
          <h1 className="mt-1 text-2xl font-bold">Segundo filtro de convocatoria</h1>
          <p className="mt-1 text-slate-500">{item.nombre}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <p>
              <span className="text-slate-400">Fuente</span>
              <br />
              {item.fuente?.nombre || "-"}
            </p>
            <p>
              <span className="text-slate-400">Financiador</span>
              <br />
              {item.financiador_nombre || "-"}
            </p>
            <p>
              <span className="text-slate-400">Primer filtro</span>
              <br />
              {resultLabels[primerResultado]}
            </p>
          </div>
        </div>
      </section>
      <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-900">Resultado del primer filtro</h2>
            <p className="mt-1 text-sm text-slate-500">
              Referencia de solo lectura para esta revisión.
            </p>
          </div>
          <Badge variant={primerResultado === "no_viable" ? "destructive" : "secondary"}>
            {resultLabels[primerResultado]}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ELIGIBILITY_CRITERIA.map((criterion) => {
            const evaluation = primerFiltro.find((row) => row.criterio_codigo === criterion.codigo);
            return (
              <div className="rounded-xl bg-slate-50 p-3 text-sm" key={criterion.codigo}>
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-slate-700">{criterion.nombre}</span>
                  <span className="text-slate-500 capitalize">
                    {evaluation?.estado_revision || "pendiente"}
                  </span>
                </div>
                {evaluation?.observacion && (
                  <p className="mt-1 text-xs text-slate-500">{evaluation.observacion}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Revisado por: {reviewerName(primerFiltro)} ·{" "}
          {primerFiltro[0]?.revisado_at
            ? new Date(primerFiltro[0].revisado_at).toLocaleString("es-PE")
            : "Sin fecha"}
        </p>
      </section>
      <ConvocatoriaEligibilityForm
        convocatoria={item}
        evaluaciones={segundoFiltro}
        mode="segundo_filtro"
        saving={saving}
        canEvaluate={canReview}
        onSave={save}
        onCancel={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}`)}
      />
    </div>
  );
}
