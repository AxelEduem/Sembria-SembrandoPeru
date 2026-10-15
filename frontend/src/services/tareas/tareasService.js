import { apiRequest } from "@/services/api";
import {
  AGENDA_CACHE_GROUPS as GROUPS,
  AGENDA_CACHE_TTL as TTL,
  getCachedAgendaData,
  invalidateAgendaCache,
} from "@/services/agenda/cache";

export async function getTareas({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`tasks:${cacheScope}`, async () => {
    const response = await apiRequest("/api/tareas");
    return response?.data || [];
  }, { force, ttl: TTL.TASKS, groups: [GROUPS.TASKS] });
}

export async function getTareaIntegrantes({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`task-people:${cacheScope}`, async () => {
    const response = await apiRequest("/api/tareas/integrantes");
    return response?.data || [];
  }, { force, ttl: TTL.TASK_PEOPLE, groups: [GROUPS.TASK_PEOPLE] });
}

export async function createTarea(values) {
  const response = await apiRequest("/api/tareas", {
    method: "POST",
    csrf: true,
    body: normalizePayload(values),
  });
  invalidateAgendaCache(GROUPS.TASKS);
  return response?.data;
}

export async function updateTarea(taskId, values) {
  const response = await apiRequest(`/api/tareas/${taskId}`, {
    method: "PUT",
    csrf: true,
    body: normalizePayload(values),
  });
  invalidateAgendaCache(GROUPS.TASKS);
  return response?.data;
}

export async function updateTareaStatus(taskId, estado) {
  const response = await apiRequest(`/api/tareas/${taskId}/estado`, {
    method: "PATCH",
    csrf: true,
    body: { estado },
  });
  invalidateAgendaCache(GROUPS.TASKS);
  return response?.data;
}

export async function addTareaNote(taskId, contenido) {
  const response = await apiRequest(`/api/tareas/${taskId}/notas`, {
    method: "POST",
    csrf: true,
    body: { contenido },
  });
  invalidateAgendaCache(GROUPS.TASKS);
  return response?.data;
}

function normalizePayload(values) {
  return {
    titulo: values.titulo,
    descripcion: values.descripcion || "",
    asignadas_a: values.asignadas_a,
    prioridad: values.prioridad,
    fecha_limite: values.fecha_limite || null,
  };
}
