import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ConvocatoriaEligibilityForm from "@/components/gestion-proyectos/ConvocatoriaEligibilityForm";
import {
  getConvocatoriaPrimerFiltro,
  getEvaluacionesPorFiltro,
  getEligibilityResult,
  savePrimerFiltro,
} from "@/services/gestion-proyectos/convocatoriasService";
export default function ConvocatoriaEvaluationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    getConvocatoriaPrimerFiltro(id)
      .then(setItem)
      .catch((e) => setError(e.message));
  }, [id]);
  async function save(evaluaciones) {
    setSaving(true);
    try {
      await savePrimerFiltro(id, evaluaciones);
      navigate(`/gestion-proyectos/detecta/convocatorias/${id}`, {
        state: { feedback: { type: "success", message: "Primer filtro guardado correctamente." } },
      });
    } catch (e) {
      setError(e.message || "No se pudo guardar la evaluación.");
    } finally {
      setSaving(false);
    }
  }
  if (error) return <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>;
  if (!item) return <div className="p-10 text-center">Cargando convocatoria...</div>;
  return (
    <div className="module-page-enter mx-auto max-w-6xl pb-10">
      <button
        type="button"
        onClick={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-slate-500 hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a convocatoria
      </button>
      <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#2D5A3D]" />
        <div className="p-6">
          <p className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
            Gestión de Proyectos · Detecta
          </p>
          <h1 className="mt-1 text-2xl font-bold">Primer filtro de convocatoria</h1>
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
              {item.financiador_nombre}
            </p>
            <p>
              <span className="text-slate-400">Resultado actual</span>
              <br />
              {getEligibilityResult(getEvaluacionesPorFiltro(item.evaluaciones)).replace("_", " ")}
            </p>
          </div>
        </div>
      </section>
      <ConvocatoriaEligibilityForm
        convocatoria={item}
        evaluaciones={getEvaluacionesPorFiltro(item.evaluaciones)}
        mode="primer_filtro"
        saving={saving}
        canEvaluate={item.primer_filtro_autorizado !== false}
        onSave={save}
        onCancel={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}`)}
      />
    </div>
  );
}
