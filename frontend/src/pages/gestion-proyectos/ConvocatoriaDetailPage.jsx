import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Landmark,
  ListChecks,
  MapPinned,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConvocatoriaEligibilityForm from "@/components/gestion-proyectos/ConvocatoriaEligibilityForm";
import ConvocatoriaProcessTimeline from "@/components/gestion-proyectos/ConvocatoriaProcessTimeline";
import {
  EnvioPostulacionWorkspace,
  PostulacionWorkspace,
} from "@/pages/gestion-proyectos/ConvocatoriaPostulacionPage";
import ConvocatoriaSeguimientoPage from "@/pages/gestion-proyectos/ConvocatoriaSeguimientoPage";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FeedbackToast from "@/components/ui/FeedbackToast";
import {
  CONVOCATORIA_PROCESS_LABELS,
  getConvocatoriaProcessStage,
} from "@/constants/convocatoriaProcess";
import { useAuth } from "@/contexts/AuthContext";
import {
  archiveConvocatoria,
  canStartApproval,
  canStartPostulacion,
  ELIGIBILITY_CRITERIA,
  finalizarPreparacionPostulacion,
  formatConvocatoriaOption,
  getConvocatoria,
  getEvaluacionesPorFiltro,
  getEligibilityResult,
  getPostulacionActiva,
  getPostulacionDetalle,
  getResultadoElegibilidadActual,
  getSeguimiento,
  iniciarPostulacion,
  isFiltroCompletado,
  registrarEnvioPostulacion,
  restoreConvocatoria,
  savePrimerFiltro,
  savePostulacionRow,
  saveAprobacionConvocatoria,
  saveSegundoFiltro,
} from "@/services/gestion-proyectos/convocatoriasService";
import { hasAnyPermission, hasPermission, PERMISSIONS } from "@/utils/permissions";

const results = {
  elegible: "Cumplió",
  no_viable: "No cumplió",
  pendiente_revision: "Pendiente",
};

const nameOf = (person) => [person?.nombres, person?.apellidos].filter(Boolean).join(" ");
const show = (value) => String(value || "-").replaceAll("_", " ");
const formatDate = (value, withTime = false) => {
  if (!value) return "No definida";
  const date = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
  return date.toLocaleString("es-PE", withTime ? undefined : { dateStyle: "medium" });
};
const formatAmount = (currency, value) =>
  value == null || value === ""
    ? "No especificado"
    : `${currency || ""} ${new Intl.NumberFormat("es-PE", {
        maximumFractionDigits: 2,
      }).format(Number(value))}`.trim();

const POSTULATION_VIEW_PERMISSIONS = [
  PERMISSIONS.GP_CONVOCATORIAS_POSTULAR,
  PERMISSIONS.GP_CONVOCATORIAS_VER_POSTULACION,
  PERMISSIONS.GP_CONVOCATORIAS_VER_ENVIO,
  PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO,
  PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE,
];

const TRACKING_VIEW_PERMISSIONS = [
  PERMISSIONS.GP_CONVOCATORIAS_POSTULAR,
  PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO,
  PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE,
];

export default function ConvocatoriaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [item, setItem] = useState(null);
  const [postulacion, setPostulacion] = useState(null);
  const [seguimiento, setSeguimiento] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(location.state?.feedback || null);
  const [showFirstFilterForm, setShowFirstFilterForm] = useState(false);
  const [savingFirstFilter, setSavingFirstFilter] = useState(false);
  const [pendingFirstFilter, setPendingFirstFilter] = useState(null);
  const firstFilterFormRef = useRef(null);
  const [showSecondFilterForm, setShowSecondFilterForm] = useState(false);
  const [savingSecondFilter, setSavingSecondFilter] = useState(false);
  const [pendingSecondFilter, setPendingSecondFilter] = useState(null);
  const secondFilterFormRef = useRef(null);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState("aprobada");
  const [approvalObservation, setApprovalObservation] = useState("");
  const [savingApproval, setSavingApproval] = useState(false);
  const [confirmingApproval, setConfirmingApproval] = useState(false);
  const approvalFormRef = useRef(null);
  const [showPostulationWorkspace, setShowPostulationWorkspace] = useState(false);
  const [postulationDetail, setPostulationDetail] = useState(null);
  const [workingPostulation, setWorkingPostulation] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState(null);
  const [lifecycleReason, setLifecycleReason] = useState("");
  const postulationWorkspaceRef = useRef(null);
  const canLoadPostulation = hasAnyPermission(profile, POSTULATION_VIEW_PERMISSIONS);
  const canLoadTracking = hasAnyPermission(profile, TRACKING_VIEW_PERMISSIONS);

  const load = useCallback(async () => {
    const convocatoria = await getConvocatoria(id, { cacheScope });
    let post = null;

    if (canLoadPostulation) {
      try {
        post = await getPostulacionActiva(id);
      } catch {
        // El detalle general sigue disponible aunque el perfil no pueda consultar esta etapa.
      }
    }

    let tracking = null;

    if (post?.estado === "enviada" && canLoadTracking) {
      try {
        tracking = await getSeguimiento(post.id);
      } catch {
        // El seguimiento es información complementaria y no bloquea el detalle.
      }
    }

    setItem(convocatoria);
    setPostulacion(post);
    setSeguimiento(tracking);
  }, [cacheScope, canLoadPostulation, canLoadTracking, id]);

  useEffect(() => {
    queueMicrotask(() => {
      load().catch((requestError) => setError(requestError.message));
    });
  }, [load]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!item) return <p className="p-10 text-center">Cargando convocatoria...</p>;

  const first = getEvaluacionesPorFiltro(item.evaluaciones, "primer_filtro");
  const second = getEvaluacionesPorFiltro(item.evaluaciones, "segundo_filtro");
  const approval = Array.isArray(item.aprobacion) ? item.aprobacion[0] : item.aprobacion;
  const firstResult = getEligibilityResult(first);
  const secondResult = getEligibilityResult(second);
  const registrationView =
    location.state?.sourceProcess === "registro" ||
    new URLSearchParams(location.search).get("vista") === "registro";
  const firstFilterView =
    location.state?.sourceProcess === "primer_filtro" ||
    new URLSearchParams(location.search).get("vista") === "primer_filtro";
  const secondFilterView =
    location.state?.sourceProcess === "segundo_filtro" ||
    new URLSearchParams(location.search).get("vista") === "segundo_filtro";
  const approvalView =
    location.state?.sourceProcess === "aprobacion" ||
    new URLSearchParams(location.search).get("vista") === "aprobacion";
  const postulationView =
    location.state?.sourceProcess === "postulacion" ||
    new URLSearchParams(location.search).get("vista") === "postulacion";
  const shipmentView =
    location.state?.sourceProcess === "envio" ||
    new URLSearchParams(location.search).get("vista") === "envio";
  const trackingView =
    location.state?.sourceProcess === "seguimiento" ||
    new URLSearchParams(location.search).get("vista") === "seguimiento";
  const focusedStageView =
    firstFilterView ||
    secondFilterView ||
    approvalView ||
    postulationView ||
    shipmentView ||
    trackingView;
  const currentStage = getConvocatoriaProcessStage({
    ...item,
    postulaciones: postulacion
      ? [{ ...postulacion, seguimientos: seguimiento ? [seguimiento] : [] }]
      : item.postulaciones,
  });
  const status = item.resultado_final
    ? {
        adjudicada: "Adjudicada",
        no_adjudicada: "No adjudicada",
        descartada: "Descartada",
      }[item.resultado_final]
    : firstResult === "no_viable" ||
    secondResult === "no_viable" ||
    approval?.decision === "rechazada"
      ? "No aprobada"
      : approval?.decision === "aprobada"
        ? "Aprobada"
        : "Pendiente";
  const closedAt =
    firstResult === "no_viable"
      ? "Primer filtro"
      : secondResult === "no_viable"
        ? "Segundo filtro"
        : approval?.decision === "rechazada"
          ? "Aprobación"
          : seguimiento
            ? "Seguimiento"
            : item.etapa && !["cierre", "deteccion"].includes(item.etapa)
              ? CONVOCATORIA_PROCESS_LABELS[item.etapa] || show(item.etapa)
              : "Primer filtro";
  const processLabel =
    currentStage === "cierre"
      ? closedAt
      : CONVOCATORIA_PROCESS_LABELS[currentStage] || show(currentStage);
  const hasFirstFilterReview = first.length > 0;
  const isTerminal = ["cerrada", "archivada"].includes(item.estado);
  const canEdit =
    hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_EDITAR) && !hasFirstFilterReview && !isTerminal;
  const canEvaluate = item.primer_filtro_autorizado === true
    && hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_EVALUAR);
  const canReview = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_REVISAR);
  const canApprove = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_APROBAR);
  const canPostular = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_POSTULAR);
  const canArchive = hasPermission(profile, PERMISSIONS.GP_CONVOCATORIAS_ARCHIVAR);
  const primary =
    !isTerminal && !first.length && canEvaluate
      ? ["Realizar primer filtro", "evaluacion", ClipboardCheck]
      : first.length && !second.length && canReview
        ? ["Realizar segundo filtro", "segundo-filtro", ListChecks]
        : canStartApproval(item.evaluaciones) && !approval && canApprove
          ? ["Realizar aprobación", "aprobacion", ShieldCheck]
          : null;
  const postAction =
    !isTerminal && canPostular && canStartPostulacion(item.evaluaciones, approval)
      ? [
          postulacion?.estado === "enviada"
            ? "Ver postulación"
            : postulacion
              ? "Continuar postulación"
              : "Iniciar postulación",
          "postulacion",
          Send,
        ]
      : null;
  const seguimientoAction =
    !isTerminal && canPostular && postulacion?.estado === "enviada"
      ? [
          seguimiento?.estado === "cerrado"
            ? "Ver seguimiento"
            : "Gestionar seguimiento",
          "seguimiento",
          Activity,
        ]
      : null;
  const go = (path) =>
    navigate(`/gestion-proyectos/detecta/convocatorias/${id}/${path}`, {
      state: {
        listSearch: location.state?.listSearch || "",
        sourceProcess: location.state?.sourceProcess,
      },
    });
  const openFirstFilterForm = () => {
    setShowFirstFilterForm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        firstFilterFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        firstFilterFormRef.current?.querySelector("select")?.focus({ preventScroll: true });
      });
    });
  };
  const openSecondFilterForm = () => {
    setShowSecondFilterForm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        secondFilterFormRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        secondFilterFormRef.current?.querySelector("select")?.focus({ preventScroll: true });
      });
    });
  };
  const openApprovalForm = () => {
    setShowApprovalForm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        approvalFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        approvalFormRef.current
          ?.querySelector("[data-approval-option]")
          ?.focus({ preventScroll: true });
      });
    });
  };
  const saveInlineFirstFilter = (evaluations) => {
    if (
      evaluations.length !== ELIGIBILITY_CRITERIA.length ||
      evaluations.some(
        (evaluation) => !["cumple", "no_cumple"].includes(evaluation.estado_revision),
      )
    ) {
      setFeedback({
        type: "error",
        message: "Debes calificar todos los criterios antes de guardar el primer filtro.",
      });
      return;
    }
    setPendingFirstFilter(evaluations);
  };
  const confirmInlineFirstFilter = async () => {
    if (!pendingFirstFilter) return;
    setSavingFirstFilter(true);
    try {
      await savePrimerFiltro(id, pendingFirstFilter);
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=primer_filtro", {
        state: {
          feedback: {
            type: "success",
            message: "Primer filtro guardado. La calificación quedó registrada como definitiva.",
          },
        },
      });
    } catch (saveError) {
      setPendingFirstFilter(null);
      setFeedback({
        type: "error",
        message: saveError.message || "No se pudo guardar el primer filtro.",
      });
    } finally {
      setSavingFirstFilter(false);
    }
  };
  const saveInlineSecondFilter = (evaluations) => {
    if (
      evaluations.length !== ELIGIBILITY_CRITERIA.length ||
      evaluations.some(
        (evaluation) => !["cumple", "no_cumple"].includes(evaluation.estado_revision),
      )
    ) {
      setFeedback({
        type: "error",
        message: "Debes calificar todos los criterios antes de guardar el segundo filtro.",
      });
      return;
    }
    setPendingSecondFilter(evaluations);
  };
  const confirmInlineSecondFilter = async () => {
    if (!pendingSecondFilter) return;
    setSavingSecondFilter(true);
    try {
      await saveSegundoFiltro(id, pendingSecondFilter);
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=segundo_filtro", {
        state: {
          feedback: {
            type: "success",
            message: "Segundo filtro guardado. La calificación quedó registrada como definitiva.",
          },
        },
      });
    } catch (saveError) {
      setPendingSecondFilter(null);
      setFeedback({
        type: "error",
        message: saveError.message || "No se pudo guardar el segundo filtro.",
      });
    } finally {
      setSavingSecondFilter(false);
    }
  };
  const saveInlineApproval = () => {
    if (approvalDecision === "rechazada" && !approvalObservation.trim()) {
      setFeedback({
        type: "error",
        message: "Debes registrar una justificación para no aprobar la convocatoria.",
      });
      return;
    }
    setConfirmingApproval(true);
  };
  const confirmInlineApproval = async () => {
    setSavingApproval(true);
    try {
      await saveAprobacionConvocatoria(id, approvalDecision, approvalObservation);
      const approved = approvalDecision === "aprobada";
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=aprobacion", {
        state: {
          feedback: {
            type: "success",
            message: approved
              ? "Convocatoria aprobada y enviada a Postulación."
              : "Convocatoria no aprobada y enviada a Cierre.",
          },
        },
      });
    } catch (saveError) {
      setConfirmingApproval(false);
      setFeedback({
        type: "error",
        message: saveError.message || "No se pudo guardar la aprobación.",
      });
    } finally {
      setSavingApproval(false);
    }
  };
  const openPostulationWorkspace = async () => {
    setWorkingPostulation(true);
    try {
      let activePostulation = postulacion;
      if (!activePostulation) {
        activePostulation = await iniciarPostulacion(id);
        setFeedback({ type: "success", message: "Postulación iniciada correctamente." });
      }
      const detail = await getPostulacionDetalle(activePostulation.id);
      setPostulacion(activePostulation);
      setPostulationDetail(detail);
      setShowPostulationWorkspace(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          postulationWorkspaceRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          postulationWorkspaceRef.current
            ?.querySelector("input, select, textarea, button")
            ?.focus({ preventScroll: true });
        });
      });
    } catch (workspaceError) {
      setFeedback({
        type: "error",
        message: workspaceError.message || "No se pudo iniciar la postulación.",
      });
    } finally {
      setWorkingPostulation(false);
    }
  };
  const saveInlinePostulation = async (table, payload, rowId) => {
    try {
      await savePostulacionRow(table, payload, rowId);
      setPostulationDetail(await getPostulacionDetalle(postulacion.id));
      setFeedback({ type: "success", message: "Cambios guardados." });
      return true;
    } catch (saveError) {
      setFeedback({
        type: "error",
        message: saveError.message || "No se pudieron guardar los cambios.",
      });
      return false;
    }
  };
  const advanceInlinePostulation = async () => {
    setWorkingPostulation(true);
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
    } catch (advanceError) {
      setFeedback({
        type: "error",
        message: advanceError.message || "No se pudo avanzar al proceso de Envío a equipo IDEAR.",
      });
    } finally {
      setWorkingPostulation(false);
    }
  };
  const submitInlineShipment = async (values) => {
    setWorkingPostulation(true);
    try {
      await registrarEnvioPostulacion(postulacion.id, values);
      navigate("/gestion-proyectos/detecta/convocatorias?proceso=seguimiento", {
        state: {
          feedback: {
            type: "success",
            message: "Envío a IDEAR registrado y seguimiento iniciado correctamente.",
          },
        },
      });
    } catch (shipmentError) {
      setFeedback({
        type: "error",
        message: shipmentError.message || "No se pudo registrar el envío a IDEAR.",
      });
    } finally {
      setWorkingPostulation(false);
    }
  };
  const openLifecycle = (action) => {
    setLifecycleAction(action);
    setLifecycleReason("");
  };
  const submitLifecycle = async () => {
    const reason = lifecycleReason.trim();
    if (lifecycleAction === "archive" && !reason) {
      setFeedback({ type: "error", message: "Registra el motivo para continuar." });
      return;
    }
    setWorkingPostulation(true);
    try {
      if (lifecycleAction === "archive") await archiveConvocatoria(id, reason);
      if (lifecycleAction === "restore") await restoreConvocatoria(id);
      await load();
      const messages = {
        archive: "Convocatoria archivada correctamente.",
        restore: "Convocatoria restaurada correctamente.",
      };
      setFeedback({ type: "success", message: messages[lifecycleAction] });
      setLifecycleAction(null);
    } catch (lifecycleError) {
      setFeedback({
        type: "error",
        message: lifecycleError.message || "No se pudo actualizar la convocatoria.",
      });
    } finally {
      setWorkingPostulation(false);
    }
  };

  return (
    <div className="module-page-enter mx-auto max-w-6xl pb-10">
      <button
        type="button"
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        onClick={() =>
          navigate(`/gestion-proyectos/detecta/convocatorias${location.state?.listSearch || ""}`)
        }
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a convocatorias
      </button>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-[#2D5A3D]" />
        <div className="bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-[0.12em] text-emerald-700 uppercase">
                Gestión de Proyectos · Detecta
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {item.nombre}
              </h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <Landmark className="h-4 w-4 text-emerald-700" />
                {item.financiador_nombre || "Financiador no especificado"}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={
                    ["Aprobada", "Adjudicada"].includes(status)
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : ["No aprobada", "No adjudicada", "Descartada"].includes(status)
                        ? "border-red-100 bg-red-50 text-red-700"
                        : "border-amber-100 bg-amber-50 text-amber-700"
                  }
                >
                  Estado: {status}
                </Badge>
                <Badge variant="secondary">
                  {currentStage === "cierre" ? "Finalizó en" : "Etapa actual"}: {processLabel}
                </Badge>
                {!registrationView && (
                  <Badge
                    variant={
                      getResultadoElegibilidadActual(item.evaluaciones) === "no_viable"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {results[getResultadoElegibilidadActual(item.evaluaciones)]}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex max-w-xl flex-wrap justify-end gap-2">
              {!registrationView && !focusedStageView && primary && (
                <ProcessButton action={primary} onClick={() => go(primary[1])} />
              )}
              {!registrationView && !focusedStageView && postAction && (
                <ProcessButton action={postAction} onClick={() => go("postulacion")} />
              )}
              {!registrationView && !focusedStageView && seguimientoAction && (
                <ProcessButton
                  action={seguimientoAction}
                  onClick={() => go("seguimiento")}
                />
              )}
              {!registrationView && !focusedStageView && first.length > 0 && canEvaluate && (
                <ProcessButton
                  action={["Ver primer filtro", "evaluacion", ClipboardCheck]}
                  onClick={() => go("evaluacion")}
                  secondary
                />
              )}
              {!registrationView && !focusedStageView && second.length > 0 && canReview && (
                <ProcessButton
                  action={["Ver segundo filtro", "segundo-filtro", ListChecks]}
                  onClick={() => go("segundo-filtro")}
                  secondary
                />
              )}
              {canEdit && registrationView && (
                <Button variant="outline" className="gap-2 bg-white" onClick={() => go("editar")}>
                  <Pencil className="h-4 w-4" />
                  Editar registro
                </Button>
              )}
              {canArchive && item.estado === "archivada" && (
                <Button
                  variant="outline"
                  className="gap-2 bg-white"
                  disabled={workingPostulation}
                  onClick={() => openLifecycle("restore")}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restaurar convocatoria
                </Button>
              )}
              {canArchive && item.estado === "cerrada" && item.resultado_final && (
                <Button variant="outline" className="gap-2 bg-white" disabled={workingPostulation} onClick={() => openLifecycle("archive")}>
                  <Archive className="h-4 w-4" /> Archivar convocatoria
                </Button>
              )}
            </div>
          </div>
          {registrationView && !canEdit && hasFirstFilterReview && (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La información de registro es de solo lectura porque el primer filtro ya fue revisado.
            </div>
          )}
        </div>
      </section>

      {item.resultado_final && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold tracking-[0.12em] text-slate-500 uppercase">Resultado final</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{status}</p>
          {item.motivo_descarte && <p className="mt-2 text-sm leading-6 text-slate-600">{item.motivo_descarte}</p>}
          <p className="mt-2 text-xs text-slate-400">Cierre registrado: {formatDate(item.cerrada_at, true)}</p>
        </div>
      )}

      {!focusedStageView && (
        <div className="mt-5">
          <ConvocatoriaProcessTimeline
            convocatoria={item}
            etapa={item.etapa}
            primerCompleto={isFiltroCompletado(first)}
            segundoCompleto={isFiltroCompletado(second)}
            aprobacion={Boolean(approval)}
            postulacion={postulacion}
            seguimiento={seguimiento}
          />
        </div>
      )}

      <SectionHeading
        title="Información de la convocatoria"
        text="Resumen organizado de la oportunidad de financiamiento registrada."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard
          icon={FileText}
          title="Información general"
          description="Origen, condiciones y accesos oficiales."
          tone="emerald"
          values={[
            ["Fuente de búsqueda", item.fuente?.nombre],
            ["Tipo de financiamiento", show(item.tipo_financiamiento)],
            ["Enlace de convocatoria", item.url_convocatoria, "link"],
            ["Link de Nota concepto o formulario de postulación", item.url_postulacion, "link"],
            [
              "Lleva cofinanciamiento",
              item.lleva_cofinanciamiento == null
                ? "-"
                : item.lleva_cofinanciamiento
                  ? "Sí"
                  : "No",
            ],
            [
              "Tipo de Organización admitida",
              formatConvocatoriaOption(item.tipo_organizacion_admitida),
            ],
          ]}
        />
        <InfoCard
          icon={WalletCards}
          title="Fechas y financiamiento"
          description="Plazos y valores económicos de referencia."
          tone="amber"
          values={[
            ["Fecha de apertura", formatDate(item.fecha_apertura)],
            ["Tiempo de postulación", formatConvocatoriaOption(item.tiempo_postulacion)],
            ["Fecha de cierre", formatDate(item.fecha_cierre)],
            ["Monto mínimo", formatAmount(item.moneda, item.monto_minimo)],
            ["Monto máximo", formatAmount(item.moneda, item.monto_maximo)],
          ]}
        />
        <InfoCard
          icon={MapPinned}
          title="Características del proyecto"
          description="Alcance temático, territorial y población objetivo."
          tone="cyan"
          values={[
            ["Sector", show(item.sector)],
            ["Tipo de proyecto", show(item.tipo_proyecto)],
            ["Territorio", item.territorio],
            ["Beneficiario ideal", formatConvocatoriaOption(item.beneficiario_ideal)],
            ["Tipo de alianza", formatConvocatoriaOption(item.tipo_alianza)],
          ]}
        />
        <InfoCard
          icon={UserRound}
          title="Datos del registro"
          description="Responsable y contexto en el que se detectó la oportunidad."
          tone="violet"
          values={[
            ["Registrada por", nameOf(item.registrante?.persona) || "No disponible"],
            ["Fecha de registro", formatDate(item.fecha_registro || item.created_at, true)],
          ]}
        />
      </div>

      {firstFilterView && (
        <>
          <SectionHeading
            title="Primer filtro"
            text={
              first.length
                ? "Calificación definitiva registrada para esta convocatoria."
                : "Evalúa los criterios utilizando la información mostrada en esta misma página."
            }
          />
          {first.length ? (
            <FilterReadOnly rows={first} title="Primer filtro" />
          ) : showFirstFilterForm ? (
            <div ref={firstFilterFormRef} className="module-section-enter scroll-mt-24 space-y-4">
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">La calificación será definitiva</p>
                  <p className="mt-1 text-sm leading-6">
                    Revisa cuidadosamente cada criterio. Después de guardar el primer filtro no
                    podrás editar ni reemplazar las respuestas seleccionadas.
                  </p>
                </div>
              </div>
              <ConvocatoriaEligibilityForm
                convocatoria={item}
                evaluaciones={[]}
                mode="primer_filtro"
                saving={savingFirstFilter}
                canEvaluate={canEvaluate}
                showResultSummary={false}
                onSave={saveInlineFirstFilter}
                onCancel={() => setShowFirstFilterForm(false)}
              />
            </div>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
              <ClipboardCheck className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                El primer filtro aún está pendiente.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Revisa la información de la convocatoria antes de comenzar la evaluación.
              </p>
              {canEvaluate && (
                <ActionButton
                  action="confirm"
                  icon={ClipboardCheck}
                  className="mt-5"
                  onClick={openFirstFilterForm}
                >
                  Realizar primer filtro
                </ActionButton>
              )}
            </section>
          )}
        </>
      )}

      {secondFilterView && (
        <>
          <SectionHeading
            title="Segundo filtro"
            text={
              second.length
                ? "Calificación registrada para esta convocatoria."
                : "Realiza la revisión detallada utilizando la información mostrada arriba."
            }
          />
          {second.length ? (
            <FilterReadOnly rows={second} title="Segundo filtro" />
          ) : showSecondFilterForm ? (
            <div ref={secondFilterFormRef} className="module-section-enter scroll-mt-24 space-y-4">
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-bold">Revisa todos los criterios</p>
                  <p className="mt-1 text-sm leading-6">
                    Debes indicar si cumple o no cumple en los ocho criterios antes de guardar el
                    segundo filtro.
                  </p>
                </div>
              </div>
              <ConvocatoriaEligibilityForm
                convocatoria={item}
                evaluaciones={[]}
                mode="segundo_filtro"
                saving={savingSecondFilter}
                canEvaluate={canReview}
                showResultSummary={false}
                onSave={saveInlineSecondFilter}
                onCancel={() => setShowSecondFilterForm(false)}
              />
            </div>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
              <ListChecks className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                El segundo filtro aún está pendiente.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Revisa la información de la convocatoria antes de comenzar la evaluación.
              </p>
              {canReview && (
                <ActionButton
                  action="confirm"
                  icon={ListChecks}
                  className="mt-5"
                  onClick={openSecondFilterForm}
                >
                  Realizar segundo filtro
                </ActionButton>
              )}
            </section>
          )}
        </>
      )}

      {approvalView && (
        <>
          <SectionHeading
            title="Filtros de evaluación"
            text="Consulta aquí las respuestas que sustentan la decisión de aprobación."
          />
          <div className="space-y-5">
            <FilterReadOnly rows={first} title="Primer filtro" />
            <FilterReadOnly rows={second} title="Segundo filtro" />
          </div>

          <SectionHeading
            title="Aprobación final"
            text="Registra la decisión final para continuar a Postulación o cerrar la convocatoria."
          />
          {approval ? (
            <ApprovalReadOnly approval={approval} />
          ) : showApprovalForm ? (
            <ApprovalDecisionForm
              formRef={approvalFormRef}
              decision={approvalDecision}
              observation={approvalObservation}
              saving={savingApproval}
              onDecisionChange={setApprovalDecision}
              onObservationChange={setApprovalObservation}
              onSave={saveInlineApproval}
              onCancel={() => setShowApprovalForm(false)}
            />
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
              <ShieldCheck className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                La aprobación final está pendiente.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Revisa los resultados de ambos filtros antes de registrar la decisión final.
              </p>
              {canApprove && canStartApproval(item.evaluaciones) && (
                <ActionButton
                  action="confirm"
                  icon={ShieldCheck}
                  className="mt-5"
                  onClick={openApprovalForm}
                >
                  Realizar aprobación
                </ActionButton>
              )}
            </section>
          )}
        </>
      )}

      {postulationView && (
        <>
          <SectionHeading
            title="Evaluaciones de la convocatoria"
            text="Consulta los filtros y la aprobación que permitieron avanzar a Postulación."
          />
          <div className="space-y-5">
            <FilterReadOnly rows={first} title="Primer filtro" />
            <FilterReadOnly rows={second} title="Segundo filtro" />
          </div>

          <SectionHeading
            title="Aprobación final"
            text="Decisión que habilitó la preparación de la postulación."
          />
          {approval ? (
            <ApprovalReadOnly approval={approval} />
          ) : (
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
              La aprobación final todavía no ha sido registrada.
            </section>
          )}

          <SectionHeading
            title="Postulación"
            text="Inicia la preparación del proyecto cuando hayas revisado toda la información anterior."
          />
          {!showPostulationWorkspace && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-8 text-center">
              <Send className="mx-auto h-9 w-9 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                {postulacion
                  ? "La preparación de la postulación ya fue iniciada."
                  : "La convocatoria está lista para iniciar su postulación."}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {postulacion
                  ? "Continúa completando el proyecto y los requisitos pendientes."
                  : "Se habilitarán el checklist, los documentos y la propuesta."}
              </p>
              {canPostular && (
                <Button
                  disabled={workingPostulation}
                  className="mt-5 gap-2 bg-[#2D5A3D] hover:bg-[#234B32]"
                  onClick={openPostulationWorkspace}
                >
                  <Send className="h-4 w-4" />
                  {workingPostulation
                    ? "Preparando..."
                    : postulacion
                      ? "Continuar postulación"
                      : "Iniciar postulación"}
                </Button>
              )}
            </section>
          )}
          {showPostulationWorkspace && (
            <div ref={postulationWorkspaceRef} className="module-section-enter scroll-mt-24">
              <PostulacionWorkspace
                detail={postulationDetail}
                postulacion={postulacion}
                onSave={saveInlinePostulation}
                onAdvance={advanceInlinePostulation}
                busy={workingPostulation}
                readOnly={!canPostular}
              />
            </div>
          )}
        </>
      )}

      {shipmentView && (
        <>
          <SectionHeading
            title="Envío a equipo IDEAR"
            text="Registra al líder IDEAR, las fechas de revisión, el radicado y el plazo de respuesta."
          />
          {postulacion && ["lista_para_enviar", "enviada"].includes(postulacion.estado) ? (
            <EnvioPostulacionWorkspace
              postulacion={postulacion}
              seguimiento={seguimiento}
              onSubmit={submitInlineShipment}
              busy={workingPostulation}
              readOnly={!canPostular}
            />
          ) : (
            <section className="rounded-2xl border border-amber-100 bg-amber-50 p-5 text-sm text-amber-800">
              Primero debes completar la preparación y pasar la postulación al proceso de Envío a equipo IDEAR.
            </section>
          )}
        </>
      )}

      {trackingView && (
        <>
          <SectionHeading
            title="Seguimiento"
            text="Registra comunicaciones, solicitudes y el resultado de la postulación enviada."
          />
          <ConvocatoriaSeguimientoPage embedded />
        </>
      )}

      {!registrationView && !focusedStageView && (
        <>
          <SectionHeading
            title="Evaluación"
            text="Resultados y responsables de los filtros de elegibilidad."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            <Evaluation
              title="Primer filtro"
              rows={first}
              action={
                canEvaluate
                  ? [
                      first.length ? "Ver evaluación" : "Realizar primer filtro",
                      "evaluacion",
                      ClipboardCheck,
                    ]
                  : null
              }
              onAction={go}
            />
            <Evaluation
              title="Segundo filtro"
              rows={second}
              blocked={!isFiltroCompletado(first)}
              action={
                isFiltroCompletado(first) && canReview
                  ? [
                      second.length ? "Ver evaluación" : "Realizar segundo filtro",
                      "segundo-filtro",
                      ListChecks,
                    ]
                  : null
              }
              onAction={go}
            />
          </div>

          <SectionHeading
            title="Aprobación"
            text="Decisión final antes de iniciar la postulación."
          />
          <ApprovalSummary
            approval={approval}
            canApprove={canApprove}
            eligible={canStartApproval(item.evaluaciones)}
            onOpen={() => go("aprobacion")}
          />

          <SectionHeading
            title="Actividad y trazabilidad"
            text="Movimientos registrados durante el proceso de la convocatoria."
          />
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {item.historial.length ? (
              item.historial.map((entry) => (
                <div
                  className="flex gap-3 border-b border-slate-100 py-3 first:pt-0 last:border-0 last:pb-0"
                  key={entry.id}
                >
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {entry.observacion || show(entry.accion)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {nameOf(entry.actor?.persona) || "Usuario"} ·{" "}
                      {formatDate(entry.created_at, true)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Aún no hay actividad registrada.</p>
            )}
          </section>
        </>
      )}

      <Dialog
        open={lifecycleAction !== null}
        onOpenChange={(open) => {
          if (!open && !workingPostulation) setLifecycleAction(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {lifecycleAction === "archive" && "Archivar convocatoria"}
              {lifecycleAction === "restore" && "Restaurar convocatoria"}
            </DialogTitle>
          </DialogHeader>
          {lifecycleAction === "archive" && (
            <label className="block text-sm font-semibold text-slate-700">
              Motivo
              <textarea value={lifecycleReason} onChange={(event) => setLifecycleReason(event.target.value)} rows={4} className="mt-2 w-full rounded-md border border-slate-300 p-3 text-sm" placeholder="Describe el motivo institucional" />
            </label>
          )}
          {lifecycleAction === "restore" && <p className="text-sm text-slate-600">La convocatoria volverá a su estado cerrado anterior y conservará todo su historial.</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLifecycleAction(null)} disabled={workingPostulation}>Cancelar</Button>
            <ActionButton action="confirm" onClick={submitLifecycle} loading={workingPostulation} loadingText="Guardando...">
              Confirmar
            </ActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingFirstFilter !== null}
        onOpenChange={(open) => {
          if (!open && !savingFirstFilter) setPendingFirstFilter(null);
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <div className="h-1.5 bg-amber-500" />
          <div className="p-6">
            <DialogHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl text-slate-900">
                ¿Guardar la evaluación del primer filtro?
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Esta calificación será definitiva
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Después de confirmar no podrás cambiar las respuestas ni las observaciones. Revisa
                cuidadosamente los ocho criterios antes de continuar.
              </p>
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={savingFirstFilter}
                onClick={() => setPendingFirstFilter(null)}
              >
                Volver a revisar
              </Button>
              <ActionButton
                action="save"
                type="button"
                loading={savingFirstFilter}
                loadingText="Guardando..."
                onClick={confirmInlineFirstFilter}
              >
                Confirmar y guardar
              </ActionButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingSecondFilter !== null}
        onOpenChange={(open) => {
          if (!open && !savingSecondFilter) setPendingSecondFilter(null);
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <div className="h-1.5 bg-amber-500" />
          <div className="p-6">
            <DialogHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl text-slate-900">
                ¿Guardar la evaluación del segundo filtro?
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">
                Esta calificación será definitiva
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Después de confirmar no podrás cambiar las respuestas ni las observaciones. Revisa
                cuidadosamente los ocho criterios antes de continuar.
              </p>
            </div>
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={savingSecondFilter}
                onClick={() => setPendingSecondFilter(null)}
              >
                Volver a revisar
              </Button>
              <ActionButton
                action="save"
                type="button"
                loading={savingSecondFilter}
                loadingText="Guardando..."
                onClick={confirmInlineSecondFilter}
              >
                Confirmar y guardar
              </ActionButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirmingApproval}
        onOpenChange={(open) => {
          if (!open && !savingApproval) setConfirmingApproval(false);
        }}
      >
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <div
            className={`h-1.5 ${approvalDecision === "aprobada" ? "bg-emerald-600" : "bg-red-600"}`}
          />
          <div className="p-6">
            <DialogHeader>
              <div
                className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border ${
                  approvalDecision === "aprobada"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {approvalDecision === "aprobada" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <XCircle className="h-6 w-6" />
                )}
              </div>
              <DialogTitle className="text-xl text-slate-900">
                {approvalDecision === "aprobada"
                  ? "¿Confirmar aprobación?"
                  : "¿Confirmar que no será aprobada?"}
              </DialogTitle>
            </DialogHeader>
            <div
              className={`mt-4 rounded-xl border px-4 py-3 ${
                approvalDecision === "aprobada"
                  ? "border-emerald-100 bg-emerald-50"
                  : "border-red-100 bg-red-50"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  approvalDecision === "aprobada" ? "text-emerald-900" : "text-red-900"
                }`}
              >
                {approvalDecision === "aprobada"
                  ? "La convocatoria avanzará a Postulación"
                  : "La convocatoria finalizará en Aprobación"}
              </p>
              <p
                className={`mt-1 text-sm leading-6 ${
                  approvalDecision === "aprobada" ? "text-emerald-800" : "text-red-800"
                }`}
              >
                {approvalDecision === "aprobada"
                  ? "Al confirmar, el equipo podrá comenzar la preparación de la postulación."
                  : "Al confirmar, se registrará como no aprobada y será enviada a Cierre."}
              </p>
            </div>
            {approvalObservation.trim() && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold tracking-wide text-slate-400 uppercase">
                  Observación
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{approvalObservation}</p>
              </div>
            )}
            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                disabled={savingApproval}
                onClick={() => setConfirmingApproval(false)}
              >
                Volver a revisar
              </Button>
              <ActionButton
                action="confirm"
                tone={approvalDecision === "aprobada" ? "primary" : "danger"}
                type="button"
                loading={savingApproval}
                loadingText="Guardando..."
                onClick={confirmInlineApproval}
              >
                {approvalDecision === "aprobada" ? "Confirmar aprobación" : "Confirmar no aprobación"}
              </ActionButton>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
    </div>
  );
}

function ProcessButton({ action, onClick, secondary = false }) {
  const Icon = action[2];

  if (!secondary) {
    return (
      <ActionButton action="confirm" icon={Icon} onClick={onClick}>
        {action[0]}
      </ActionButton>
    );
  }

  return (
    <Button
      variant="outline"
      className="gap-2 bg-white"
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {action[0]}
    </Button>
  );
}

function SectionHeading({ title, text }) {
  return (
    <div className="module-section-enter mt-8 mb-4">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, title, description, tone, values }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <dl className="grid gap-px bg-slate-100 sm:grid-cols-2">
        {values.map(([label, value, type]) => (
          <div
            key={label}
            className={`bg-white px-5 py-4 ${type === "wide" ? "sm:col-span-2" : ""}`}
          >
            <dt className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">
              {label}
            </dt>
            <dd className="mt-1.5 text-sm leading-6 font-medium break-words text-slate-700">
              {type === "link" && value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-700 hover:underline"
                >
                  Abrir enlace
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : (
                value || "-"
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function FilterReadOnly({ rows, title }) {
  const result = getEligibilityResult(rows);
  const reviewer = rows.find((row) => row.revisor?.persona)?.revisor?.persona;

  return (
    <section className="module-section-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-900">Resultado del {title.toLowerCase()}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Revisado por {nameOf(reviewer) || "No disponible"} · {formatDate(rows[0]?.revisado_at)}
          </p>
        </div>
        <Badge variant={result === "no_viable" ? "destructive" : "secondary"}>
          {results[result]}
        </Badge>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {ELIGIBILITY_CRITERIA.map((criterion, index) => {
          const evaluation = rows.find((row) => row.criterio_codigo === criterion.codigo);
          const passed = evaluation?.estado_revision === "cumple";
          return (
            <article key={criterion.codigo} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {index + 1}. {criterion.nombre}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{criterion.descripcion}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    passed
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-red-100 bg-red-50 text-red-700"
                  }
                >
                  {passed ? "Cumplió" : "No cumplió"}
                </Badge>
              </div>
              {evaluation?.observacion && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                  {evaluation.observacion}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ApprovalDecisionForm({
  formRef,
  decision,
  observation,
  saving,
  onDecisionChange,
  onObservationChange,
  onSave,
  onCancel,
}) {
  return (
    <section
      ref={formRef}
      className="module-section-enter scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="font-semibold text-slate-900">Decisión de aprobación</h3>
        <p className="mt-1 text-sm text-slate-500">
          Revisa los filtros anteriores y selecciona la decisión correspondiente.
        </p>
      </div>
      <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <ApprovalOption
            value="aprobada"
            current={decision}
            onChange={onDecisionChange}
            icon={CheckCircle2}
            title="Aprobar convocatoria"
            text="La convocatoria continuará a la etapa de Postulación."
          />
          <ApprovalOption
            value="rechazada"
            current={decision}
            onChange={onDecisionChange}
            icon={XCircle}
            title="No aprobar convocatoria"
            text="La convocatoria finalizará en la etapa de Aprobación."
          />
        </div>
        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Justificación u observaciones{decision === "rechazada" && " *"}
          <textarea
            className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm transition-colors outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            value={observation}
            disabled={saving}
            onChange={(event) => onObservationChange(event.target.value)}
            placeholder="Registra los motivos o comentarios de la decisión final..."
          />
        </label>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>
            Cancelar
          </Button>
          <ActionButton
            action="save"
            tone={decision === "rechazada" ? "danger" : "primary"}
            type="button"
            loading={saving}
            loadingText="Guardando..."
            onClick={onSave}
          >
            Guardar decisión
          </ActionButton>
        </div>
      </div>
    </section>
  );
}

function ApprovalOption({ value, current, onChange, icon: Icon, title, text }) {
  const selected = current === value;
  const rejected = value === "rechazada";
  return (
    <button
      type="button"
      data-approval-option
      onClick={() => onChange(value)}
      className={`rounded-xl border p-4 text-left transition-all ${
        selected
          ? rejected
            ? "border-red-300 bg-red-50 ring-2 ring-red-100"
            : "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <Icon className={`mb-2 h-5 w-5 ${rejected ? "text-red-600" : "text-emerald-600"}`} />
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </button>
  );
}

function ApprovalReadOnly({ approval }) {
  const approved = approval.decision === "aprobada";
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        approved ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {approved ? (
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-700" />
        ) : (
          <XCircle className="h-6 w-6 shrink-0 text-red-700" />
        )}
        <div>
          <h3 className="font-bold text-slate-900">
            {approved ? "Convocatoria aprobada" : "Convocatoria no aprobada"}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Revisada por {nameOf(approval.decisor?.persona) || "No disponible"} ·{" "}
            {formatDate(approval.decidido_at, true)}
          </p>
          {approval.observacion && (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Justificación: {approval.observacion}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Evaluation({ title, rows, blocked, action, onAction }) {
  const result = getEligibilityResult(rows);
  const reviewer = rows.find((row) => row.revisor?.persona)?.revisor?.persona;
  const completed = rows.filter((row) => row.estado_revision === "cumple").length;
  const Icon = action?.[2];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {blocked
              ? "Requiere completar el primer filtro."
              : rows.length
                ? results[result]
                : "Pendiente de revisión"}
          </p>
        </div>
        <Badge variant={result === "no_viable" ? "destructive" : "secondary"}>
          {rows.length ? results[result] : "Pendiente"}
        </Badge>
      </div>
      {rows.length > 0 && (
        <>
          <p className="mt-4 text-sm text-slate-700">{completed} de 8 criterios cumplidos</p>
          <p className="mt-2 text-xs text-slate-500">
            Revisado por: {nameOf(reviewer) || "No disponible"} · {formatDate(rows[0]?.revisado_at)}
          </p>
        </>
      )}
      {action && (
        <Button variant="outline" className="mt-5 gap-2" onClick={() => onAction(action[1])}>
          <Icon className="h-4 w-4" />
          {action[0]}
        </Button>
      )}
    </section>
  );
}

function ApprovalSummary({ approval, canApprove, eligible, onOpen }) {
  if (approval) {
    const approved = approval.decision === "aprobada";
    const person = nameOf(approval.decisor?.persona);
    return (
      <section
        className={`rounded-2xl border p-5 shadow-sm ${
          approved ? "border-emerald-100 bg-emerald-50" : "border-red-100 bg-red-50"
        }`}
      >
        <h3 className="font-semibold">{approved ? "Aprobada" : "No aprobada"}</h3>
        <p className="mt-2 text-sm">
          Revisada por: {person || "No disponible"} · {formatDate(approval.decidido_at, true)}
        </p>
        {approval.observacion && (
          <p className="mt-2 text-sm">Justificación: {approval.observacion}</p>
        )}
        {canApprove && (
          <Button variant="outline" className="mt-4" onClick={onOpen}>
            Ver aprobación
          </Button>
        )}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Aprobación final</h3>
          <p className="mt-1 text-sm text-slate-500">
            {eligible
              ? "Pendiente de aprobación."
              : "Pendiente de completar los filtros requeridos."}
          </p>
        </div>
        {eligible && canApprove && (
          <ActionButton action="confirm" icon={ShieldCheck} onClick={onOpen}>
            Realizar aprobación
          </ActionButton>
        )}
      </div>
    </section>
  );
}
