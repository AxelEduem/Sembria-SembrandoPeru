import {
  canStartApproval,
  getEligibilityResult,
  getEvaluacionesPorFiltro,
  isFiltroCompletado,
} from "@/services/gestion-proyectos/convocatoriasService";
import {
  hasAnyPermission,
  PERMISSIONS,
} from "@/utils/permissions";

export const CONVOCATORIA_PROCESS_STAGES = [
  { key: "registro", label: "Registro" },
  { key: "primer_filtro", label: "Primer filtro" },
  { key: "segundo_filtro", label: "Segundo filtro" },
  { key: "aprobacion", label: "Aprobación" },
  { key: "postulacion", label: "Postulación" },
  { key: "envio", label: "Envío a equipo IDEAR" },
  { key: "seguimiento", label: "Seguimiento" },
  { key: "cierre", label: "Cierre" },
];

export const CONVOCATORIA_PROCESS_LABELS = Object.fromEntries(
  CONVOCATORIA_PROCESS_STAGES.map(({ key, label }) => [key, label]),
);

const PROCESS_PERMISSIONS = {
  registro: [PERMISSIONS.GP_CONVOCATORIAS_CREAR],
  primer_filtro: [PERMISSIONS.GP_CONVOCATORIAS_EVALUAR],
  segundo_filtro: [PERMISSIONS.GP_CONVOCATORIAS_REVISAR],
  aprobacion: [PERMISSIONS.GP_CONVOCATORIAS_APROBAR, PERMISSIONS.GP_CONVOCATORIAS_VER_APROBACION],
  postulacion: [PERMISSIONS.GP_CONVOCATORIAS_POSTULAR, PERMISSIONS.GP_CONVOCATORIAS_VER_POSTULACION],
  envio: [PERMISSIONS.GP_CONVOCATORIAS_POSTULAR, PERMISSIONS.GP_CONVOCATORIAS_VER_ENVIO],
  seguimiento: [PERMISSIONS.GP_CONVOCATORIAS_POSTULAR, PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO],
  cierre: [PERMISSIONS.GP_CONVOCATORIAS_ARCHIVAR, PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE],
};

export function getVisibleConvocatoriaProcessStages(profile) {
  return CONVOCATORIA_PROCESS_STAGES.filter((stage) =>
    hasAnyPermission(profile, PROCESS_PERMISSIONS[stage.key]),
  );
}

function firstActivePostulacion(convocatoria) {
  const postulaciones = Array.isArray(convocatoria?.postulaciones)
    ? convocatoria.postulaciones
    : convocatoria?.postulaciones
      ? [convocatoria.postulaciones]
      : [];
  return postulaciones.find((item) => item.estado !== "cancelada") || null;
}

function firstSeguimiento(postulacion) {
  const seguimientos = Array.isArray(postulacion?.seguimientos)
    ? postulacion.seguimientos
    : postulacion?.seguimiento
      ? [postulacion.seguimiento]
      : [];
  return seguimientos[0] || null;
}

/** The single source of truth for the work tray of a convocatoria. */
export function getConvocatoriaProcessStage(convocatoria) {
  const first = getEvaluacionesPorFiltro(convocatoria?.evaluaciones, "primer_filtro");
  const second = getEvaluacionesPorFiltro(convocatoria?.evaluaciones, "segundo_filtro");
  const approval = Array.isArray(convocatoria?.aprobacion)
    ? convocatoria.aprobacion[0]
    : convocatoria?.aprobacion;
  const postulacion = firstActivePostulacion(convocatoria);
  const seguimiento = firstSeguimiento(postulacion);

  if (seguimiento?.estado === "cerrado" || convocatoria?.etapa === "cierre") return "cierre";
  if (["rechazada", "no_viable", "archivada"].includes(convocatoria?.estado)) return "cierre";
  if (approval?.decision === "rechazada") return "cierre";
  if (seguimiento) return "seguimiento";
  if (postulacion?.estado === "enviada") return "seguimiento";
  if (postulacion?.estado === "lista_para_enviar") return "envio";
  if (postulacion || approval?.decision === "aprobada") return "postulacion";
  if (canStartApproval(convocatoria?.evaluaciones) && !approval) return "aprobacion";
  if (isFiltroCompletado(second)) return getEligibilityResult(second) === "elegible" ? "aprobacion" : "cierre";
  if (isFiltroCompletado(first)) return getEligibilityResult(first) === "elegible" ? "segundo_filtro" : "cierre";
  return convocatoria?.estado === "borrador" ? "registro" : "primer_filtro";
}

export function getConvocatoriaProcessData(convocatoria) {
  const postulacion = firstActivePostulacion(convocatoria);
  return { postulacion, seguimiento: firstSeguimiento(postulacion) };
}
