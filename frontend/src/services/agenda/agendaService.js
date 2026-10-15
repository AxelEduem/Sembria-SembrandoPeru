import { apiRequest } from "@/services/api";
import {
  AGENDA_CACHE_GROUPS as GROUPS,
  AGENDA_CACHE_TTL as TTL,
  clearAgendaCache,
  getCachedAgendaData,
  invalidateAgendaCache,
  invalidateAgendaDirectoryCache,
} from "./cache";

export function clearAgendaMetricsCache() {
  invalidateAgendaCache(GROUPS.METRICS);
}

export function clearAgendaHistoryCache() {
  invalidateAgendaCache(GROUPS.HISTORY);
}

export {
  clearAgendaCache,
  invalidateAgendaCache,
  invalidateAgendaDirectoryCache,
  GROUPS as AGENDA_CACHE_GROUPS,
};

export async function getAgendaPeople({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`people:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/people");
    return response?.data || [];
  }, { force, ttl: TTL.PEOPLE, groups: [GROUPS.PEOPLE] });
}

export async function getAgendaCurrentPerson({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`current-person:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/me");
    return response?.data || null;
  }, { force, ttl: TTL.CURRENT_PERSON, groups: [GROUPS.CURRENT_PERSON] });
}

export async function getAgendaMeetings({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`meetings:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/meetings");
    return response?.data || [];
  }, { force, ttl: TTL.MEETINGS, groups: [GROUPS.MEETINGS] });
}

export async function getAgendaHistory({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`history:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/history");
    return response?.data || [];
  }, { force, ttl: TTL.HISTORY, groups: [GROUPS.HISTORY] });
}

export async function getAgendaMetrics({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`metrics:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/metrics");
    return response?.data || null;
  }, { force, ttl: TTL.METRICS, groups: [GROUPS.METRICS] });
}

export async function createAgendaMeeting(values) {
  const response = await apiRequest("/api/agenda/meetings", {
    method: "POST",
    csrf: true,
    body: {
      titulo: values.titulo,
      descripcion: values.descripcion || "",
      fecha: values.fecha,
      hora_inicio: values.horaInicio,
      hora_fin: values.horaFin,
      modalidad: values.modalidad,
      ubicacion: values.ubicacion || "",
      enlace: values.enlace || "",
      participantes: values.participantes,
    },
  });

  invalidateAgendaCache(GROUPS.MEETINGS, GROUPS.HISTORY, GROUPS.METRICS);
  return response?.data;
}

export async function respondAgendaInvitation(meetingId, response) {
  const result = await apiRequest(`/api/agenda/meetings/${meetingId}/response`, {
    method: "PATCH",
    csrf: true,
    body: { respuesta: response },
  });

  invalidateAgendaCache(GROUPS.MEETINGS, GROUPS.HISTORY, GROUPS.METRICS);
  return result?.data;
}

export async function cancelAgendaMeeting(meetingId) {
  const response = await apiRequest(`/api/agenda/meetings/${meetingId}/cancel`, {
    method: "PATCH",
    csrf: true,
  });

  invalidateAgendaCache(GROUPS.MEETINGS, GROUPS.HISTORY, GROUPS.METRICS);
  return response?.data;
}
