import { apiRequest } from "@/services/api";
import {
  CARGOS_CACHE_GROUPS as GROUPS,
  CARGOS_CACHE_TTL as TTL,
  getCachedCargoData,
} from "./cache";

function normalizeId(id) {
  const normalizedId = Number(id);
  return Number.isInteger(normalizedId) && normalizedId > 0 ? normalizedId : null;
}

function sortCargos(rows = []) {
  return [...rows].sort((firstCargo, secondCargo) => {
    const firstDate = new Date(firstCargo?.created_at || 0).getTime();
    const secondDate = new Date(secondCargo?.created_at || 0).getTime();

    if (Number.isNaN(firstDate) || Number.isNaN(secondDate)) {
      return String(secondCargo?.nombre || "").localeCompare(String(firstCargo?.nombre || ""));
    }

    return secondDate - firstDate;
  });
}

export async function getCargoById(id, { force = false, cacheScope = "default" } = {}) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) throw new Error("El cargo seleccionado no es válido.");

  return getCachedCargoData(`detail:${cacheScope}:${normalizedId}`, async () => {
    const response = await apiRequest(`/api/cargos/${normalizedId}`);
    return response?.data;
  }, { force, ttl: TTL.DETAIL, groups: [GROUPS.DETAIL] });
}

export async function getCargos({ force = false, cacheScope = "default" } = {}) {
  return getCachedCargoData(`list:${cacheScope}`, async () => {
    const response = await apiRequest("/api/cargos");
    return sortCargos(Array.isArray(response?.data) ? response.data : []);
  }, { force, ttl: TTL.LIST, groups: [GROUPS.LIST] });
}
