import { apiRequest } from "@/services/api";
import {
  convocatoriaDetailKey,
  convocatoriaListKey,
  fuentesKey,
  GESTION_PROYECTOS_CACHE_GROUPS,
  GESTION_PROYECTOS_CACHE_TTL,
  invalidateConvocatorias,
  loadGestionProyectosCached,
} from "./cache";

export const ELIGIBILITY_CRITERIA = [
  ["internacional", "Internacional", "Debe ser emitida por una entidad extranjera."],
  ["organizacion_admitida", "Tipo de organización admitida", "Debe aceptar ONG como postulante."],
  ["alianzas", "Alianzas", "No debe exigir alianza o consorcio obligatorio."],
  ["tipo_proyecto", "Tipo de proyecto", "Implementación piloto o ejecución territorial."],
  ["territorio", "Territorio", "Debe incluir Latinoamérica o Perú."],
  ["fecha_cierre", "Fecha de cierre", "Debe tener más de 30 días desde el registro."],
  ["alineacion_sectorial", "Alineación sectorial", "Medio Ambiente, Salud, Educación o Fauna."],
  [
    "rango_financiamiento",
    "Rango de financiamiento",
    "Referencia institucional: USD 50,000 a USD 300,000.",
  ],
].map(([codigo, nombre, descripcion]) => ({ codigo, nombre, descripcion }));

export const SEGUIMIENTO_ESTADOS = {
  en_seguimiento: "En seguimiento",
  requiere_respuesta: "Requiere respuesta",
  resultado_registrado: "Resultado registrado",
  cerrado: "Cerrado",
};

const CONVOCATORIA_OPTION_LABELS = {
  alianza_comunitaria: "Alianza comunitaria",
  alianza_institucional: "Alianza institucional",
  alianza_educativa: "Alianza educativa",
  investigadores: "Investigadores",
  profesionales: "Profesionales",
  sin_alianzas: "Sin alianzas",
  emprendedores: "Emprendedores",
  comunidades: "Comunidades",
  ongs: "ONGs",
  organizaciones: "Organizaciones",
  agricultores_campesinos: "Agricultores campesinos",
  mas_de_un_beneficiario: "Más de 1 beneficiario",
  personas_naturales: "Personas naturales",
  empresas: "Empresas",
  universidades: "Universidades",
  otro: "Otro",
  sin_limite: "Sin límite de fecha",
  con_limite: "Con límite de fecha",
  "0_15": "USD 0K a 15K",
  "15_25": "USD 15K a 25K",
  "25_50": "USD 25K a 50K",
  "50_100": "USD 50K a 100K",
  "100_200": "USD 100K a 200K",
  "200_mas": "USD 200K o más",
};

export function formatConvocatoriaOption(value, fallback = "-") {
  if (!value) return fallback;
  return CONVOCATORIA_OPTION_LABELS[value] || String(value).replaceAll("_", " ");
}

function invalidateConvocatoriaMutation(promise) {
  return promise.then((value) => {
    invalidateConvocatorias();
    return value;
  });
}

export function getEligibilityResult(evaluaciones = []) {
  const states = evaluaciones.map((item) => item.estado_revision || "pendiente");
  if (states.includes("no_cumple")) return "no_viable";
  if (states.length === ELIGIBILITY_CRITERIA.length && states.every((state) => state === "cumple"))
    return "elegible";
  return "pendiente_revision";
}

export function getFuentes({ force = false, cacheScope = "default" } = {}) {
  return loadGestionProyectosCached(
    fuentesKey(cacheScope),
    async () => {
      const response = await apiRequest("/api/gestion-proyectos/fuentes-financiamiento");
      return Array.isArray(response?.data) ? response.data : [];
    },
    {
      force,
      ttl: GESTION_PROYECTOS_CACHE_TTL.CATALOG,
      groups: [GESTION_PROYECTOS_CACHE_GROUPS.FUENTES],
      channel: "convocatorias",
    },
  );
}

export async function createFuente(input) {
  const response = await apiRequest("/api/gestion-proyectos/fuentes-financiamiento", {
    method: "POST",
    csrf: true,
    body: input,
  });
  invalidateConvocatorias({ includeFuentes: true });
  return response?.data;
}

export function getEvaluacionesPorFiltro(evaluaciones = [], tipoFiltro = "primer_filtro") {
  return evaluaciones.filter((item) => (item.tipo_filtro || "primer_filtro") === tipoFiltro);
}

export function isFiltroCompletado(evaluaciones = []) {
  return (
    evaluaciones.length === ELIGIBILITY_CRITERIA.length &&
    evaluaciones.every((item) => item.estado_revision !== "pendiente")
  );
}

export function getResultadoElegibilidadActual(evaluaciones = []) {
  const primerFiltro = getEvaluacionesPorFiltro(evaluaciones, "primer_filtro");
  const segundoFiltro = getEvaluacionesPorFiltro(evaluaciones, "segundo_filtro");
  return getEligibilityResult(isFiltroCompletado(segundoFiltro) ? segundoFiltro : primerFiltro);
}

export function canStartApproval(evaluaciones = []) {
  const primerFiltro = getEvaluacionesPorFiltro(evaluaciones, "primer_filtro");
  const segundoFiltro = getEvaluacionesPorFiltro(evaluaciones, "segundo_filtro");
  return (
    isFiltroCompletado(primerFiltro) &&
    isFiltroCompletado(segundoFiltro) &&
    getEligibilityResult(segundoFiltro) === "elegible"
  );
}

export function canStartPostulacion(evaluaciones = [], approval) {
  const first = getEvaluacionesPorFiltro(evaluaciones, "primer_filtro");
  const second = getEvaluacionesPorFiltro(evaluaciones, "segundo_filtro");
  return (
    isFiltroCompletado(first) &&
    isFiltroCompletado(second) &&
    getEligibilityResult(second) === "elegible" &&
    approval?.decision === "aprobada"
  );
}

export function getDaysRemaining(fechaCierre) {
  if (!fechaCierre) return null;
  return Math.ceil((new Date(`${fechaCierre}T00:00:00`) - new Date()) / 86400000);
}

export function getSuggestedEvaluations(form, evaluations) {
  const days = getDaysRemaining(form.fecha_cierre);
  return evaluations.map((evaluation) => {
    if (evaluation.estado_revision !== "pendiente") return evaluation;
    if (evaluation.criterio_codigo === "fecha_cierre" && form.tiempo_postulacion === "sin_limite")
      return { ...evaluation, estado_revision: "cumple" };
    if (evaluation.criterio_codigo === "fecha_cierre" && days !== null)
      return { ...evaluation, estado_revision: days > 30 ? "cumple" : "no_cumple" };
    if (
      evaluation.criterio_codigo === "rango_financiamiento" &&
      form.moneda === "USD" &&
      form.monto_minimo !== "" &&
      form.monto_maximo !== ""
    )
      return {
        ...evaluation,
        estado_revision:
          Number(form.monto_minimo) >= 50000 && Number(form.monto_maximo) <= 300000
            ? "cumple"
            : "no_cumple",
      };
    return evaluation;
  });
}

export function validateConvocatoria(input) {
  if (!input.nombre?.trim() || !input.financiador_nombre?.trim() || !input.fuente_id)
    return "Nombre, entidad financiadora y fuente son obligatorios.";
  if (input.lleva_cofinanciamiento !== "1" && input.lleva_cofinanciamiento !== "0")
    return "Indica si lleva cofinanciamiento.";
  if (!input.tipo_organizacion_admitida) return "Selecciona un tipo de organización admitida.";
  if (!input.tiempo_postulacion) return "Selecciona el tiempo de postulación.";
  if (input.tiempo_postulacion === "con_limite" && !input.fecha_cierre)
    return "Indica la fecha de cierre para una postulación con límite.";
  if (!input.tipo_alianza) return "Selecciona un tipo de alianza.";
  for (const key of ["url_convocatoria", "url_postulacion"])
    if (input[key]) {
      try {
        new URL(input[key]);
      } catch {
        return "Los enlaces deben tener una URL válida.";
      }
    }
  if (input.fecha_apertura && input.fecha_cierre && input.fecha_apertura > input.fecha_cierre)
    return "La fecha de apertura no puede ser posterior al cierre.";
  if (input.fecha_cierre && input.fecha_cierre <= new Date().toISOString().slice(0, 10))
    return "La fecha de cierre debe ser posterior a hoy.";
  const min = input.monto_minimo === "" ? null : Number(input.monto_minimo),
    max = input.monto_maximo === "" ? null : Number(input.monto_maximo);
  if ([min, max].some((n) => n !== null && (!Number.isFinite(n) || n < 0)))
    return "Los montos deben ser números positivos.";
  if (min !== null && max !== null && min > max)
    return "El monto mínimo no puede superar el máximo.";
  return "";
}

export function getConvocatorias({ force = false, cacheScope = "default" } = {}) {
  return loadGestionProyectosCached(
    convocatoriaListKey(cacheScope),
    async () => {
      const response = await apiRequest("/api/gestion-proyectos/convocatorias");
      return Array.isArray(response?.data) ? response.data : [];
    },
    {
      force,
      ttl: GESTION_PROYECTOS_CACHE_TTL.LIST,
      groups: [GESTION_PROYECTOS_CACHE_GROUPS.CONVOCATORIAS],
      channel: "convocatorias",
    },
  );
}

export function getConvocatoria(id, { force = false, cacheScope = "default" } = {}) {
  return loadGestionProyectosCached(
    convocatoriaDetailKey(id, cacheScope),
    async () => {
      const response = await apiRequest(`/api/gestion-proyectos/convocatorias/${id}`);
      return response?.data;
    },
    {
      force,
      ttl: GESTION_PROYECTOS_CACHE_TTL.DETAIL,
      groups: [GESTION_PROYECTOS_CACHE_GROUPS.CONVOCATORIA_DETAIL],
      channel: "convocatorias",
    },
  );
}

export async function saveConvocatoria(input, id = null) {
  const response = await apiRequest(
    id
      ? `/api/gestion-proyectos/convocatorias/${id}`
      : "/api/gestion-proyectos/convocatorias",
    {
      method: id ? "PUT" : "POST",
      csrf: true,
      body: input,
    },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function getEvaluacionesDeFiltro(convocatoriaId, tipoFiltro) {
  const endpoint = tipoFiltro === "segundo_filtro" ? "segundo-filtro" : "primer-filtro";
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/${endpoint}`,
  );
  return getEvaluacionesPorFiltro(response?.data?.evaluaciones, tipoFiltro);
}

export function getPrimerFiltro(convocatoriaId) {
  return apiRequest(`/api/gestion-proyectos/convocatorias/${convocatoriaId}/primer-filtro`)
    .then((response) => response?.data?.evaluaciones || []);
}

export async function getConvocatoriaPrimerFiltro(convocatoriaId) {
  const response = await apiRequest(`/api/gestion-proyectos/convocatorias/${convocatoriaId}/primer-filtro`);
  return response?.data;
}

export function getSegundoFiltro(convocatoriaId) {
  return apiRequest(`/api/gestion-proyectos/convocatorias/${convocatoriaId}/segundo-filtro`)
    .then((response) => getEvaluacionesPorFiltro(response?.data?.evaluaciones, "segundo_filtro"));
}

export async function saveEvaluacionesPorFiltro(convocatoriaId, tipoFiltro, evaluaciones) {
  if (tipoFiltro === "primer_filtro") return savePrimerFiltro(convocatoriaId, evaluaciones);
  if (tipoFiltro === "segundo_filtro") return saveSegundoFiltro(convocatoriaId, evaluaciones);
  throw new Error("El tipo de filtro no es válido.");
}

export function savePrimerFiltro(convocatoriaId, evaluaciones) {
  return invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/convocatorias/${convocatoriaId}/primer-filtro`, {
      method: "POST",
      csrf: true,
      body: { evaluaciones },
    }).then((response) => response?.data),
  );
}

export function saveSegundoFiltro(convocatoriaId, evaluaciones) {
  return invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/convocatorias/${convocatoriaId}/segundo-filtro`, {
      method: "POST",
      csrf: true,
      body: { evaluaciones },
    }).then((response) => response?.data),
  );
}

// Compatibilidad con los consumidores previos del primer filtro.
export function saveEvaluaciones(convocatoriaId, evaluaciones) {
  return savePrimerFiltro(convocatoriaId, evaluaciones);
}

export async function getAprobacionConvocatoria(convocatoriaId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/aprobacion`,
  );
  return response?.data || null;
}

export async function saveAprobacionConvocatoria(convocatoriaId, decision, observacion = "") {
  if (!["aprobada", "rechazada"].includes(decision)) throw new Error("Decisión no válida.");
  if (decision === "rechazada" && !observacion.trim())
    throw new Error("No puedes rechazar una convocatoria sin registrar una justificación.");
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/aprobacion`,
    {
      method: "POST",
      csrf: true,
      body: { decision, observacion: observacion.trim() || null },
    },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function archiveConvocatoria(convocatoriaId, motivo) {
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/archivar`,
    {
      method: "POST",
      csrf: true,
      body: { motivo },
    },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function restoreConvocatoria(convocatoriaId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/restaurar`,
    { method: "POST", csrf: true },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function getPostulacionActiva(convocatoriaId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/postulacion`,
  );
  return response?.data || null;
}

export async function iniciarPostulacion(convocatoriaId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/convocatorias/${convocatoriaId}/postulacion`,
    { method: "POST", csrf: true },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function getPostulacionDetalle(postulacionId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${postulacionId}/detalle`,
  );
  return response?.data || { checklist: [], documentos: [], propuestas: [] };
}

const POSTULACION_SECTIONS = {
  gp_postulacion_checklist: "checklist",
  gp_postulacion_documentos: "documentos",
  gp_postulacion_propuestas: "propuestas",
};

export async function finalizarPreparacionPostulacion(postulacionId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${postulacionId}/finalizar-preparacion`,
    { method: "POST", csrf: true },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function savePostulacionRow(table, payload, id = null) {
  const section = POSTULACION_SECTIONS[table];
  if (!section) throw new Error("Operación de postulación no permitida.");
  const postulacionId = payload.postulacion_id;
  if (!id && !postulacionId) throw new Error("La postulación es obligatoria.");
  const targetPostulacionId = postulacionId || payload._postulacion_id;
  if (!targetPostulacionId) throw new Error("No se pudo identificar la postulación.");
  const body = { ...payload };
  delete body.postulacion_id;
  delete body._postulacion_id;
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${targetPostulacionId}/items/${section}${id ? `/${id}` : ""}`,
    { method: id ? "PUT" : "POST", csrf: true, body },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function registrarEnvioPostulacion(postulacionId, values) {
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${postulacionId}/envio`,
    { method: "POST", csrf: true, body: values },
  );
  invalidateConvocatorias();
  return response?.data;
}

export async function getUsuariosDisponibles() {
  const response = await apiRequest("/api/gestion-proyectos/postulaciones/usuarios-disponibles");
  return Array.isArray(response?.data) ? response.data : [];
}

export async function uploadPostulacionDocumento(postulacionId, file) {
  if (!file) return null;
  const formData = new FormData();
  formData.append("archivo", file);
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${postulacionId}/documentos`,
    { method: "POST", csrf: true, body: formData },
  );
  return response?.data?.path || null;
}

export async function deletePostulacionDocumento(path) {
  if (!path) return;
  await apiRequest("/api/gestion-proyectos/postulaciones/documentos", {
    method: "DELETE",
    csrf: true,
    body: { path },
  });
}

export async function getSeguimiento(postulacionId) {
  const response = await apiRequest(
    `/api/gestion-proyectos/postulaciones/${postulacionId}/seguimiento`,
  );
  return response?.data || null;
}

export async function getSeguimientoDetalle(id) {
  const response = await apiRequest(`/api/gestion-proyectos/seguimientos/${id}`);
  return response?.data;
}
export const registrarEventoSeguimiento = (id, tipo, descripcion, fechaEvento = null) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${id}/eventos`, {
      method: "POST",
      csrf: true,
      body: { tipo, descripcion: descripcion || null, fecha_evento: fechaEvento },
    }).then((response) => response?.data),
  );
export const createComunicacion = (id, values) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${id}/comunicaciones`, {
      method: "POST",
      csrf: true,
      body: values,
    }).then((response) => response?.data),
  );
export const updateComunicacion = (id, values) =>
  invalidateConvocatoriaMutation(
    apiRequest(
      `/api/gestion-proyectos/seguimientos/${values.seguimiento_id}/comunicaciones/${id}`,
      { method: "PUT", csrf: true, body: values },
    ).then((response) => response?.data),
  );
export const deleteComunicacion = (seguimientoId, id) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${seguimientoId}/comunicaciones/${id}`, {
      method: "DELETE",
      csrf: true,
    }),
  );
export const createSolicitud = (id, values) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${id}/solicitudes`, {
      method: "POST",
      csrf: true,
      body: values,
    }).then((response) => response?.data),
  );
export const updateSolicitud = (id, values) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${values.seguimiento_id}/solicitudes/${id}`, {
      method: "PUT",
      csrf: true,
      body: values,
    }).then((response) => response?.data),
  );
export const responderSolicitud = (id, respuesta, evidencia = null, cancelar = false) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/solicitudes/${id}/respuesta`, {
      method: "POST",
      csrf: true,
      body: { respuesta: respuesta || null, evidencia, cancelar },
    }).then((response) => response?.data),
  );
export const registrarResultadoSeguimiento = (id, values) =>
  invalidateConvocatoriaMutation(
    apiRequest(`/api/gestion-proyectos/seguimientos/${id}/resultado`, {
      method: "POST",
      csrf: true,
      body: values,
    }).then((response) => response?.data),
  );
