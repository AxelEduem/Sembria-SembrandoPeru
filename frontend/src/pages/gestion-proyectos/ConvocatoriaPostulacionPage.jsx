import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  ListChecks,
  Plus,
  Send,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { API_URL } from "@/services/api";
import ConvocatoriaProcessTimeline from "@/components/gestion-proyectos/ConvocatoriaProcessTimeline";
import {
  canStartPostulacion,
  deletePostulacionDocumento,
  finalizarPreparacionPostulacion,
  getConvocatoria,
  getEvaluacionesPorFiltro,
  getPostulacionActiva,
  getPostulacionDetalle,
  iniciarPostulacion,
  isFiltroCompletado,
  savePostulacionRow,
  uploadPostulacionDocumento,
} from "@/services/gestion-proyectos/convocatoriasService";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const personName = (person) => [person?.nombres, person?.apellidos].filter(Boolean).join(" ");
const status = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  en_revision: "Lista para enviar",
  lista_para_enviar: "Lista para enviar",
  enviada: "Enviada a IDEAR",
  cancelada: "Cancelada",
};

export default function ConvocatoriaPostulacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const readOnly = !hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_POSTULAR);
  const [convocatoria, setConvocatoria] = useState(null);
  const [postulacion, setPostulacion] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const c = await getConvocatoria(id, { cacheScope });
      const p = await getPostulacionActiva(id);
      setConvocatoria(c);
      setPostulacion(p);
      if (p) setDetail(await getPostulacionDetalle(p.id));
    } catch (e) {
      setError(e.message);
    }
  }, [cacheScope, id]);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);
  async function start() {
    setBusy(true);
    try {
      await iniciarPostulacion(id);
      setFeedback({ type: "success", message: "Postulación iniciada correctamente." });
      await load();
    } catch (e) {
      setFeedback({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  }
  async function save(table, payload, rowId) {
    try {
      await savePostulacionRow(table, payload, rowId);
      await load();
      setFeedback({ type: "success", message: "Cambios guardados." });
      return true;
    } catch (e) {
      setFeedback({ type: "error", message: e.message || "No se pudieron guardar los cambios." });
      return false;
    }
  }
  async function advanceToShipment() {
    setBusy(true);
    try {
      await finalizarPreparacionPostulacion(postulacion.id);
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=envio", {
        state: {
          feedback: {
            type: "success",
            message: "La postulación está lista y pasó al proceso de Envío a equipo IDEAR.",
          },
        },
      });
    } catch (e) {
      setFeedback({ type: "error", message: e.message });
    } finally {
      setBusy(false);
    }
  }
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!convocatoria) return <p className="p-10 text-center">Cargando postulación...</p>;
  const first = getEvaluacionesPorFiltro(convocatoria.evaluaciones, "primer_filtro");
  const second = getEvaluacionesPorFiltro(convocatoria.evaluaciones, "segundo_filtro");
  const approval = Array.isArray(convocatoria.aprobacion)
    ? convocatoria.aprobacion[0]
    : convocatoria.aprobacion;
  const allowed = canStartPostulacion(convocatoria.evaluaciones, approval);
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
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#2D5A3D]" />
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
              Gestión de Proyectos · Detecta
            </p>
            <h1 className="mt-1 text-2xl font-bold">Postulación</h1>
            <p className="mt-2 font-semibold text-slate-800">{convocatoria.nombre}</p>
            <p className="text-sm text-slate-500">
              {convocatoria.financiador_nombre} · Cierre:{" "}
              {convocatoria.fecha_cierre || "No definido"} · {convocatoria.moneda}{" "}
              {convocatoria.monto_maximo || "-"}
            </p>
          </div>
          {postulacion && <Badge className="bg-emerald-700">{status[postulacion.estado]}</Badge>}
        </div>
      </section>
      <div className="mt-5">
        <ConvocatoriaProcessTimeline
          etapa={convocatoria.etapa}
          primerCompleto={isFiltroCompletado(first)}
          segundoCompleto={isFiltroCompletado(second)}
          aprobacion={Boolean(approval)}
          postulacion={
            postulacion && {
              estado: postulacion.estado,
              documentosAvanzados: detail?.documentos?.some((d) => d.estado === "validado"),
            }
          }
        />
      </div>
      <Section title="Resumen de aprobación">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <Read
            label="Primer filtro"
            value={isFiltroCompletado(first) ? "Completado" : "Pendiente"}
          />
          <Read
            label="Segundo filtro"
            value={isFiltroCompletado(second) ? "Elegible" : "Pendiente"}
          />
          <Read label="Decisión final" value={approval?.decision || "Sin decisión"} />
          <Read label="Aprobó" value={personName(approval?.decisor?.persona) || "-"} />
          <Read
            label="Fecha"
            value={
              approval?.decidido_at ? new Date(approval.decidido_at).toLocaleString("es-PE") : "-"
            }
          />
          <Read label="Observación" value={approval?.observacion || "-"} />
        </div>
      </Section>
      {!postulacion ? (
        <Section title="Iniciar postulación">
          <p className="text-sm text-slate-600">
            {allowed
              ? "La convocatoria aprobada está lista para iniciar su preparación."
              : "Esta convocatoria no cumple las condiciones de aprobación y elegibilidad requeridas."}
          </p>
          {!readOnly && <Button
            disabled={!allowed || busy}
            onClick={start}
            className="mt-4 bg-[#2D5A3D] hover:bg-[#234B32]"
          >
            {busy ? "Iniciando..." : "Iniciar postulación"}
          </Button>}
        </Section>
      ) : (
        <PostulacionWorkspace
          detail={detail}
          postulacion={postulacion}
          onSave={save}
          onAdvance={advanceToShipment}
          busy={busy}
          readOnly={readOnly}
        />
      )}
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}
const sectionMeta = {
  "Checklist de postulación": {
    icon: ListChecks,
    description: "Controla los requisitos necesarios antes de realizar el envío.",
    tone: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  "Nombre del proyecto": {
    icon: FileArchive,
    description: "Centraliza y valida los documentos que forman parte del proyecto.",
    tone: "border-violet-100 bg-violet-50 text-violet-700",
  },
  Propuesta: {
    icon: FileText,
    description: "Supervisa el avance de los componentes técnicos de la propuesta.",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
  },
  "Envío a equipo IDEAR": {
    icon: Send,
    description: "Registra al líder IDEAR, las fechas de revisión y el rango de postulación.",
    tone: "border-rose-100 bg-rose-50 text-rose-700",
  },
};

function Section({ title, children }) {
  const meta = sectionMeta[title] || sectionMeta.Propuesta;
  const Icon = meta.icon;
  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{meta.description}</p>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}
function Read({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-800">{value}</p>
    </div>
  );
}
export function PostulacionWorkspace({
  detail,
  postulacion,
  onSave,
  onAdvance,
  busy,
  readOnly = false,
}) {
  if (!detail) return <p className="p-6 text-center">Cargando preparación...</p>;
  const completedChecklist = detail.checklist.filter((item) => item.completado).length;
  const validatedDocuments = detail.documentos.filter((item) => item.estado === "validado").length;
  const proposalRows = detail.propuestas.filter((item) => item.tipo !== "marco_logico");
  const approvedProposals = proposalRows.filter((item) => item.estado === "completada").length;
  const requiredChecklist = detail.checklist.filter((item) => item.requerido);
  const readyToAdvance =
    requiredChecklist.length > 0 &&
    requiredChecklist.every((item) => item.completado) &&
    detail.documentos.every((item) => item.estado === "validado") &&
    proposalRows.length === 2 &&
    proposalRows.every((item) => item.estado === "completada");
  return (
    <>
      <section className="mt-5 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
              Espacio de trabajo
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Preparación de la postulación</h2>
            <p className="mt-1 text-sm text-slate-500">
              Completa y valida cada bloque antes de registrar el envío al equipo IDEAR.
            </p>
          </div>
          <span className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            {status[postulacion.estado] || "En preparación"}
          </span>
        </div>
        <div className="grid border-t border-emerald-100 sm:grid-cols-3">
          <ProgressMetric label="Checklist" value={completedChecklist} total={detail.checklist.length} />
          <ProgressMetric label="Documentos" value={validatedDocuments} total={detail.documentos.length} />
          <ProgressMetric label="Propuestas" value={approvedProposals} total={proposalRows.length} />
        </div>
      </section>
      <Checklist
        list={detail.checklist}
        postId={postulacion.id}
        onSave={onSave}
        readOnly={readOnly}
      />
      <Documents
        docs={detail.documentos}
        postId={postulacion.id}
        onSave={onSave}
        readOnly={readOnly}
      />
      <Proposals rows={proposalRows} postId={postulacion.id} onSave={onSave} readOnly={readOnly} />
      {!readOnly && readyToAdvance && postulacion.estado !== "lista_para_enviar" && (
        <div className="mt-5 flex justify-end">
          <ActionButton
            action="send"
            type="button"
            loading={busy}
            loadingText="Procesando..."
            onClick={onAdvance}
            className="h-11 shrink-0"
          >
            Pasar a Envío a equipo IDEAR
          </ActionButton>
        </div>
      )}
    </>
  );
}

function ProgressMetric({ label, value, total }) {
  const percentage = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="border-emerald-100 bg-white/70 px-5 py-4 sm:border-r last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-xs font-bold text-slate-800">{value}/{total}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
function Checklist({ list, postId, onSave, readOnly }) {
  const [title, setTitle] = useState("");
  const completed = list.filter((item) => item.completado).length;
  return (
    <Section title="Checklist de postulación">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{completed} de {list.length} requisitos completados</p>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          {list.length ? Math.round((completed / list.length) * 100) : 0}%
        </span>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {list.map((item) => (
          <label
            key={item.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
              item.completado
                ? "border-emerald-100 bg-emerald-50/60"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              disabled={readOnly}
              className="h-4 w-4 accent-emerald-700"
              checked={item.completado}
              onChange={(e) =>
                onSave(
                  "gp_postulacion_checklist",
                  { completado: e.target.checked, _postulacion_id: postId },
                  item.id,
                )
              }
            />
            <span className={`flex-1 ${item.completado ? "font-medium text-emerald-800" : "text-slate-700"}`}>
              {item.titulo}
            </span>
            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-slate-400 uppercase">
              {item.categoria}
            </span>
          </label>
        ))}
      </div>
      {!readOnly && (
        <form
          className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (title.trim()) {
              const saved = await onSave("gp_postulacion_checklist", {
                postulacion_id: postId,
                categoria: "PERSONALIZADO",
                titulo: title.trim(),
                requerido: false,
                orden: list.length + 1,
              });
              if (saved) setTitle("");
            }
          }}
        >
          <input
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            placeholder="Elemento personalizado"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" className="h-11 gap-2 bg-[#2D5A3D] hover:bg-[#234B32]">
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </form>
      )}
    </Section>
  );
}
function Documents({ docs, postId, onSave, readOnly }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState("");
  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return setLocalError("Ingresa el nombre del documento.");
    let archivoUrl;
    setUploading(true);
    setLocalError("");
    try {
      archivoUrl = await uploadPostulacionDocumento(postId, file);
      const saved = await onSave("gp_postulacion_documentos", {
        postulacion_id: postId,
        nombre: name.trim(),
        archivo_url: archivoUrl,
        estado: file ? "cargado" : "pendiente",
      });
      if (!saved && archivoUrl) await deletePostulacionDocumento(archivoUrl);
      else if (saved) {
        setName("");
        setFile(null);
      }
    } catch (error) {
      if (archivoUrl) await deletePostulacionDocumento(archivoUrl).catch(() => {});
      setLocalError(error.message || "No se pudo adjuntar el documento.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <Section title="Nombre del proyecto">
      {localError && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {localError}
        </div>
      )}
      {!readOnly && <form className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto]" onSubmit={add}>
        <input
          className="h-11 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del documento"
        />
        <input
          type="file"
          className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-semibold"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button type="submit" disabled={uploading} className="h-11 gap-2 bg-[#2D5A3D] hover:bg-[#234B32]">
          <Upload className="mr-1 h-4 w-4" />
          {uploading ? "Subiendo..." : "Agregar"}
        </Button>
      </form>}
      <div className="mt-3 space-y-2">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm"
          >
            <span>
              {doc.nombre}
              {doc.archivo_url && (
                <a
                  className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                  href={`${API_URL}/api/gestion-proyectos/postulaciones/documentos/${doc.id}/archivo`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </a>
              )}
            </span>
            <select
              disabled={readOnly}
              value={doc.estado}
              onChange={(e) =>
                onSave(
                  "gp_postulacion_documentos",
                  { estado: e.target.value, _postulacion_id: postId },
                  doc.id,
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="cargado">Cargado</option>
              <option value="validado">Validado</option>
              <option value="observado">Observado</option>
            </select>
          </div>
        ))}
        {!docs.length && (
          <p className="text-sm text-slate-500">
            Agrega los documentos requeridos y sus enlaces/archivos en el proyecto.
          </p>
        )}
      </div>
    </Section>
  );
}
function Proposals({ rows, postId, onSave, readOnly }) {
  return (
    <Section title="Propuesta">
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const approved = row.estado === "completada";
          return (
          <div
            key={row.id}
            className={`rounded-xl border p-4 ${approved ? "border-emerald-100 bg-emerald-50/60" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold capitalize text-slate-800">{row.tipo.replaceAll("_", " ")}</p>
              {approved && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            </div>
            <select
              disabled={readOnly}
              value={row.estado}
              onChange={(e) =>
                onSave(
                  "gp_postulacion_propuestas",
                  { estado: e.target.value, _postulacion_id: postId },
                  row.id,
                )
              }
              className={`mt-4 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none ${approved ? "border-emerald-200 bg-white text-emerald-700" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="completada">Completada</option>
              <option value="bloqueada">Bloqueada</option>
            </select>
          </div>
        )})}
      </div>
    </Section>
  );
}
export function EnvioPostulacionWorkspace({
  postulacion,
  seguimiento,
  onSubmit,
  busy,
  readOnly = false,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [values, setValues] = useState({
    lider_idear_nombre: postulacion.lider_idear_nombre || "",
    fecha_identificacion: postulacion.fecha_identificacion || "",
    fecha_revision_diseno: postulacion.fecha_revision_diseno || "",
    fecha_revision_evidencias: postulacion.fecha_revision_evidencias || "",
    fecha_revision_armado: postulacion.fecha_revision_armado || "",
    fecha_revision_primera_replica: postulacion.fecha_revision_primera_replica || "",
    fecha_envio: postulacion.fecha_envio || "",
    plazo_respuesta_dias: postulacion.plazo_respuesta_dias || "",
    rango_postulacion: postulacion.rango_postulacion || "",
  });
  const fechaRespuesta = calculateResponseDate(
    values.fecha_envio,
    values.plazo_respuesta_dias,
  );
  const submittedResponseDate = seguimiento?.fecha_estimada_decision || "";
  const submittedResponseDays = calculateDayDifference(
    postulacion.fecha_envio,
    submittedResponseDate,
  );
  if (postulacion.estado === "enviada")
    return (
      <Section title="Envío a equipo IDEAR">
        <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-800">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </span>
          <div>
            <p className="font-semibold">Envío al equipo IDEAR registrado correctamente</p>
            <p className="mt-1 text-sm text-emerald-700">
              Registrado por {postulacion.lider_idear_nombre || "el líder IDEAR"} y guardado por{" "}
              {personName(postulacion.enviada?.persona) || "usuario"}.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
          <Summary label="Fecha de Identificación" value={postulacion.fecha_identificacion} />
          <Summary label="Fecha de revisión de Diseño" value={postulacion.fecha_revision_diseno} />
          <Summary label="Fecha de revisión de Evidencias" value={postulacion.fecha_revision_evidencias} />
          <Summary label="Fecha de revisión de Armado" value={postulacion.fecha_revision_armado} />
          <Summary
            label="Fecha de revisión 1er Réplica"
            value={postulacion.fecha_revision_primera_replica}
          />
          <Summary
            label="Rango de postulación"
            value={formatRange(postulacion.rango_postulacion)}
          />
          <Summary label="Fecha de radicado" value={postulacion.fecha_envio} />
          <Summary
            label="Plazo de respuesta"
            value={submittedResponseDays ? `${submittedResponseDays} días` : "-"}
          />
          <Summary label="Fecha estimada de respuesta" value={submittedResponseDate} />
        </div>
      </Section>
    );
  return (
    <Section title="Envío a equipo IDEAR">
      <form
        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!readOnly) setConfirmOpen(true);
        }}
      >
        <fieldset disabled={readOnly} className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nombre de Líder IDEAR"
            value={values.lider_idear_nombre}
            change={(v) => setValues({ ...values, lider_idear_nombre: v })}
            placeholder="Nombre completo"
            required
          />
          <Field
            label="Fecha de Identificación"
            type="date"
            value={values.fecha_identificacion}
            change={(v) => setValues({ ...values, fecha_identificacion: v })}
            required
          />
          <Field
            label="Fecha de revisión de Diseño"
            type="date"
            value={values.fecha_revision_diseno}
            change={(v) => setValues({ ...values, fecha_revision_diseno: v })}
            required
          />
          <Field
            label="Fecha de revisión de Evidencias"
            type="date"
            value={values.fecha_revision_evidencias}
            change={(v) => setValues({ ...values, fecha_revision_evidencias: v })}
            required
          />
          <Field
            label="Fecha de revisión de Armado"
            type="date"
            value={values.fecha_revision_armado}
            change={(v) => setValues({ ...values, fecha_revision_armado: v })}
            required
          />
          <Field
            label="Fecha de revisión 1er Réplica"
            type="date"
            value={values.fecha_revision_primera_replica}
            change={(v) => setValues({ ...values, fecha_revision_primera_replica: v })}
            required
          />
          <SelectField
            label="Rango de postulación"
            value={values.rango_postulacion}
            change={(v) => setValues({ ...values, rango_postulacion: v })}
            options={RANGE_OPTIONS}
            required
          />
          <Field
            label="Fecha de radicado"
            type="date"
            value={values.fecha_envio}
            change={(v) => setValues({ ...values, fecha_envio: v })}
            required
          />
          <SelectField
            label="Plazo de respuesta"
            value={values.plazo_respuesta_dias}
            change={(v) => setValues({ ...values, plazo_respuesta_dias: v })}
            options={RESPONSE_TERM_OPTIONS}
            required
          />
          <Field
            label="Fecha estimada de respuesta"
            type="date"
            value={fechaRespuesta}
            change={() => {}}
            disabled
          />
        </fieldset>
        {!readOnly && <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
          <ActionButton
            action="send"
            type="submit"
            loading={busy}
            loadingText="Registrando..."
            className="h-11"
          >
            Registrar envío a IDEAR
          </ActionButton>
        </div>}
      </form>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-envio-titulo"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h3 id="confirmar-envio-titulo" className="mt-4 text-lg font-bold text-slate-900">
                Confirmar envío a equipo IDEAR
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Revisa cuidadosamente los datos. Al confirmar, el envío a IDEAR quedará registrado
                y la postulación pasará automáticamente al proceso de seguimiento.
              </p>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{values.lider_idear_nombre}</p>
                <p className="mt-1 text-slate-500">
                  Identificación: {values.fecha_identificacion} · {formatRange(values.rango_postulacion)}
                </p>
                <p className="mt-1 text-slate-500">
                  Radicado: {values.fecha_envio} · Respuesta: {fechaRespuesta}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Volver a revisar
              </Button>
              <ActionButton
                action="send"
                type="button"
                loading={busy}
                loadingText="Enviando..."
                onClick={() => {
                  setConfirmOpen(false);
                  onSubmit(values);
                }}
              >
                Confirmar envío a IDEAR
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
}

const RANGE_OPTIONS = [
  ["", "Selecciona un rango"],
  ["0_15", "USD 0K a 15K"],
  ["15_25", "USD 15K a 25K"],
  ["25_50", "USD 25K a 50K"],
  ["50_100", "USD 50K a 100K"],
  ["100_200", "USD 100K a 200K"],
  ["200_mas", "USD 200K o más"],
];

const RESPONSE_TERM_OPTIONS = [
  ["", "Selecciona un plazo"],
  ["30", "30 días"],
  ["45", "45 días"],
];

function calculateResponseDate(dateValue, daysValue) {
  if (!dateValue || !daysValue) return "";
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + Number(daysValue));
  return date.toISOString().slice(0, 10);
}

function calculateDayDifference(startValue, endValue) {
  if (!startValue || !endValue) return null;
  const start = new Date(`${startValue}T00:00:00Z`);
  const end = new Date(`${endValue}T00:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function formatRange(value) {
  return RANGE_OPTIONS.find(([key]) => key === value)?.[1] || "-";
}

function Summary({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <p className="mt-1 font-medium text-slate-700">{value || "-"}</p>
    </div>
  );
}

function SelectField({ label, value, change, options, required }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <select
        required={required}
        value={value}
        onChange={(event) => change(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map(([key, optionLabel]) => (
          <option key={key} value={key}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value, change, type = "text", required, placeholder, disabled = false }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
      <input
        required={required}
        disabled={disabled}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => change(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}
