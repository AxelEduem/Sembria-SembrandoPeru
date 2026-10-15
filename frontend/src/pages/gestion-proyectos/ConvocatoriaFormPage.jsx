import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConvocatoriaForm from "@/components/gestion-proyectos/ConvocatoriaForm";
import { useAuth } from "@/contexts/AuthContext";
import { useConvocatorias } from "@/hooks/useConvocatorias";
import { getConvocatoria } from "@/services/gestion-proyectos/convocatoriasService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const listPath = "/gestion-proyectos/detecta/convocatorias";

export default function ConvocatoriaFormPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const { fuentes, saving, save, addFuente } = useConvocatorias();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState("");
  const [editLocked, setEditLocked] = useState(false);
  const isEdit = mode === "edit";
  const canEdit = isEdit
    ? hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_EDITAR)
    : hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_CREAR);
  useEffect(() => {
    if (!isEdit) return;
    getConvocatoria(id, { cacheScope })
      .then((convocatoria) => {
        setRecord(convocatoria);
        setEditLocked(
          (convocatoria.evaluaciones || []).some(
            (evaluation) => (evaluation.tipo_filtro || "primer_filtro") === "primer_filtro",
          ),
        );
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [cacheScope, id, isEdit]);
  async function submit(data) {
    const saved = await save(data, isEdit ? id : null);
    if (!isEdit) {
      navigate(listPath, {
        state: {
          feedback: { type: "success", message: "Convocatoria registrada correctamente." },
        },
      });
      return;
    }
    navigate(`${listPath}/${saved.id}?vista=registro`, {
      state: {
        feedback: { type: "success", message: "Convocatoria guardada correctamente." },
        listSearch: location.state?.listSearch || "",
        sourceProcess: location.state?.sourceProcess || "registro",
      },
    });
  }
  function backToList() {
    navigate(listPath + (location.state?.listSearch || ""));
  }
  if (loading)
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />
          <div className="p-10 text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-[#2D5A3D]" />
            <p className="text-sm font-semibold text-slate-700">Cargando convocatoria</p>
            <p className="mt-1 text-xs text-slate-400">
              Preparando la información de la convocatoria...
            </p>
          </div>
        </div>
      </div>
    );
  if (error)
    return (
      <div className="module-page-enter mx-auto max-w-6xl pb-10">
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  if (editLocked)
    return (
      <div className="module-page-enter mx-auto max-w-3xl pb-10">
        <button
          type="button"
          onClick={() => navigate(`${listPath}/${id}`, { state: location.state })}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </button>
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="h-1.5 bg-amber-500" />
          <div className="p-7">
            <h1 className="text-xl font-bold text-slate-900">Edición no disponible</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta convocatoria ya fue revisada en el primer filtro. Para conservar la
              trazabilidad de la evaluación, su información de registro ya no puede modificarse.
            </p>
          </div>
        </section>
      </div>
    );
  return (
    <div className="module-page-enter mx-auto max-w-6xl pb-10">
      <div className="mb-6">
        <button
          type="button"
          onClick={backToList}
          disabled={saving}
          className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Volver a convocatorias
        </button>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-[#2D5A3D]" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                <ClipboardList className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                    Gestión de Proyectos · Detecta
                  </span>
                  {isEdit && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Edición
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {isEdit ? "Editar convocatoria" : "Nueva convocatoria"}
                </h1>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  {isEdit
                    ? "Actualiza la información de la oportunidad de financiamiento y su evaluación."
                    : "Completa la información necesaria para registrar una nueva oportunidad de financiamiento."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConvocatoriaForm
        initial={record}
        fuentes={fuentes}
        saving={saving}
        canEdit={canEdit}
        onSave={submit}
        onAddFuente={addFuente}
        onCancel={backToList}
      />
    </div>
  );
}
