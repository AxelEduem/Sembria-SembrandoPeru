import { apiRequest } from "@/services/api";
import {
  AGENDA_CACHE_GROUPS as GROUPS,
  AGENDA_CACHE_TTL as TTL,
  getCachedAgendaData,
  invalidateAgendaCache,
} from "./cache";

export async function getNotasPersonales({ force = false, cacheScope = "default" } = {}) {
  return getCachedAgendaData(`notes:${cacheScope}`, async () => {
    const response = await apiRequest("/api/agenda/notas");
    return response?.data || [];
  }, { force, ttl: TTL.NOTES, groups: [GROUPS.NOTES] });
}

export async function createNotaPersonal(values) {
  const response = await apiRequest("/api/agenda/notas", {
    method: "POST",
    csrf: true,
    body: values,
  });
  invalidateAgendaCache(GROUPS.NOTES);
  return response?.data;
}

export async function updateNotaPersonal(noteId, values) {
  const response = await apiRequest(`/api/agenda/notas/${noteId}`, {
    method: "PUT",
    csrf: true,
    body: values,
  });
  invalidateAgendaCache(GROUPS.NOTES);
  return response?.data;
}

export async function deleteNotaPersonal(noteId) {
  await apiRequest(`/api/agenda/notas/${noteId}`, {
    method: "DELETE",
    csrf: true,
  });
  invalidateAgendaCache(GROUPS.NOTES);
}
