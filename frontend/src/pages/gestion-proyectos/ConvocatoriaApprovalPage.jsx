import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  canStartApproval,
  getConvocatoria,
  getEvaluacionesPorFiltro,
  getEligibilityResult,
  isFiltroCompletado,
  saveAprobacionConvocatoria,
} from "@/services/gestion-proyectos/convocatoriasService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const labels = { elegible: "Elegible", no_viable: "No viable", pendiente_revision: "Pendiente" };
const nameOf = (person) => [person?.nombres, person?.apellidos].filter(Boolean).join(" ");
export default function ConvocatoriaApprovalPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [item, setItem] = useState(null);
  const [decision, setDecision] = useState("aprobada");
  const [observacion, setObservacion] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    getConvocatoria(id, { cacheScope })
      .then(setItem)
      .catch((requestError) => setError(requestError.message));
  }, [cacheScope, id]);
  const first = useMemo(
    () => getEvaluacionesPorFiltro(item?.evaluaciones, "primer_filtro"),
    [item],
  );
  const second = useMemo(
    () => getEvaluacionesPorFiltro(item?.evaluaciones, "segundo_filtro"),
    [item],
  );
  const approval = Array.isArray(item?.aprobacion) ? item.aprobacion[0] : item?.aprobacion;
  const eligible = canStartApproval(item?.evaluaciones);
  const canApprove = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_APROBAR);
  async function save() {
    setSaving(true);
    try {
      await saveAprobacionConvocatoria(id, decision, observacion);
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=aprobacion", {
        state: {
          feedback: {
            type: "success",
            message:
              decision === "aprobada"
                ? "Convocatoria aprobada correctamente."
                : "Convocatoria rechazada correctamente.",
          },
        },
      });
    } catch (saveError) {
      setConfirming(false);
      setError(saveError.message || "No se pudo guardar la decisión.");
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
          <h1 className="mt-1 text-2xl font-bold">Aprobación final</h1>
          <p className="mt-1 text-slate-500">{item.nombre}</p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
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
              <span className="text-slate-400">Cierre</span>
              <br />
              {item.fecha_cierre || "-"}
            </p>
            <p>
              <span className="text-slate-400">Segundo filtro</span>
              <br />
              {labels[getEligibilityResult(second)]}
            </p>
          </div>
        </div>
      </section>
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <FilterSummary
          title="Primer filtro"
          rows={first}
          onClick={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}/evaluacion`)}
        />
        <FilterSummary
          title="Segundo filtro"
          rows={second}
          onClick={() => navigate(`/gestion-proyectos/detecta/convocatorias/${id}/segundo-filtro`)}
        />
      </div>
      {approval ? (
        <ExistingApproval approval={approval} />
      ) : !canApprove ? (
        <Notice text="No tienes permiso para realizar la aprobación final." />
      ) : !eligible ? (
        <Notice
          text={
            isFiltroCompletado(first)
              ? isFiltroCompletado(second)
                ? "La convocatoria no es elegible para aprobación."
                : "Primero debe completarse el segundo filtro."
              : "Primero debe completarse el primer filtro."
          }
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Aprobación final</h2>
          <p className="mt-1 text-sm text-slate-500">
            Esta convocatoria ha completado los filtros de elegibilidad y está lista para una
            decisión final.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Decision
              value="aprobada"
              current={decision}
              onChange={setDecision}
              icon={CheckCircle2}
              title="Aprobar convocatoria"
              text="Permitirá continuar a una futura etapa de postulación."
            />
            <Decision
              value="rechazada"
              current={decision}
              onChange={setDecision}
              icon={XCircle}
              title="Rechazar convocatoria"
              text="Finaliza la convocatoria en esta etapa."
            />
          </div>
          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Justificación / observaciones{decision === "rechazada" && " *"}
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
              value={observacion}
              onChange={(event) => setObservacion(event.target.value)}
              placeholder="Registra los motivos de la decisión final..."
            />
          </label>
          <div className="mt-5 flex justify-end">
            <Button
              className={
                decision === "rechazada"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#2D5A3D] hover:bg-[#234B32]"
              }
              onClick={() => {
                if (decision === "rechazada" && !observacion.trim())
                  return setError(
                    "No puedes rechazar una convocatoria sin registrar una justificación.",
                  );
                setConfirming(true);
              }}
            >
              Guardar decisión
            </Button>
          </div>
        </section>
      )}
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "aprobada" ? "¿Confirmar aprobación?" : "¿Confirmar rechazo?"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            {decision === "aprobada"
              ? "Esta acción marcará la convocatoria como aprobada y permitirá continuar con la etapa de postulación."
              : "Esta acción marcará la convocatoria como rechazada."}
          </p>
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <ActionButton
              action="confirm"
              tone={decision === "rechazada" ? "danger" : "primary"}
              loading={saving}
              loadingText="Guardando..."
              onClick={save}
            >
              {decision === "aprobada" ? "Confirmar aprobación" : "Confirmar rechazo"}
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function FilterSummary({ title, rows, onClick }) {
  const reviewer = rows.find((row) => row.revisor?.persona)?.revisor?.persona;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Resultado: <b>{labels[getEligibilityResult(rows)]}</b>
      </p>
      <p className="mt-1 text-sm text-slate-500">
        {rows.filter((row) => row.estado_revision === "cumple").length}/8 criterios cumplidos
      </p>
      <p className="mt-3 text-xs text-slate-500">
        Revisado por: {nameOf(reviewer) || "No disponible"} ·{" "}
        {rows[0]?.revisado_at
          ? new Date(rows[0].revisado_at).toLocaleDateString("es-PE")
          : "Sin fecha"}
      </p>
      <Button variant="outline" className="mt-4" onClick={onClick}>
        Ver filtro
      </Button>
    </section>
  );
}
function Decision({ value, current, onChange, icon: Icon, title, text }) {
  const selected = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`rounded-xl border p-4 text-left ${selected ? (value === "rechazada" ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50") : "border-slate-200"}`}
    >
      <Icon
        className={`mb-2 h-5 w-5 ${value === "rechazada" ? "text-red-600" : "text-emerald-600"}`}
      />
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </button>
  );
}
function Notice({ text }) {
  return (
    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
      {text}
    </section>
  );
}
function ExistingApproval({ approval }) {
  const approved = approval.decision === "aprobada";
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${approved ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"}`}
    >
      <h2 className="font-bold">{approved ? "Convocatoria aprobada" : "Convocatoria rechazada"}</h2>
      <p className="mt-2 text-sm">
        Decisión final registrada el {new Date(approval.decidido_at).toLocaleString("es-PE")}.
      </p>
      {approval.observacion && (
        <p className="mt-3 text-sm">Justificación: {approval.observacion}</p>
      )}
    </section>
  );
}
