import { apiRequest } from "@/services/api";
import {
  AREAS_CACHE_GROUPS as GROUPS,
  AREAS_CACHE_TTL as TTL,
  getCachedAreaData,
} from "./cache";

function normalizeId(id) {
  const normalizedId = Number(id);
  return Number.isInteger(normalizedId) && normalizedId > 0 ? normalizedId : null;
}

function sortAreas(rows = []) {
  return [...rows].sort((firstArea, secondArea) => {
    const firstDate = new Date(firstArea?.created_at || 0).getTime();
    const secondDate = new Date(secondArea?.created_at || 0).getTime();

    if (Number.isNaN(firstDate) || Number.isNaN(secondDate)) {
      return String(secondArea?.nombre || "").localeCompare(String(firstArea?.nombre || ""));
    }

    return secondDate - firstDate;
  });
}

export async function getAreaById(id, { force = false, cacheScope = "default" } = {}) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) throw new Error("El área seleccionada no es válida.");

  return getCachedAreaData(`detail:${cacheScope}:${normalizedId}`, async () => {
    const response = await apiRequest(`/api/areas/${normalizedId}`);
    return response?.data;
  }, { force, ttl: TTL.DETAIL, groups: [GROUPS.DETAIL] });
}

export async function getAreas({ force = false, cacheScope = "default" } = {}) {
  return getCachedAreaData(`list:${cacheScope}`, async () => {
    const response = await apiRequest("/api/areas");
    return sortAreas(Array.isArray(response?.data) ? response.data : []);
  }, { force, ttl: TTL.LIST, groups: [GROUPS.LIST] });
}
