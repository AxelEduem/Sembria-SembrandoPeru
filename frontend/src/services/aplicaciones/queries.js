import { apiRequest } from "@/services/api";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";
import {
  APLICACIONES_CACHE_GROUPS as GROUPS,
  APLICACIONES_CACHE_TTL as TTL,
  getCachedAplicacionData,
} from "./cache";

export async function getAplicaciones({ force = false, cacheScope = "default" } = {}) {
  return getCachedAplicacionData(`list:${cacheScope}`, async () => {
    const response = await apiRequest("/api/aplicaciones");
    return response?.data || [];
  }, { force, ttl: TTL.LIST, groups: [GROUPS.LIST] });
}

export async function getAplicacionesByProfile(
  profile,
  { force = false, cacheScope = "default" } = {},
) {
  if (!profile || !hasPermission(profile, PERMISSIONS.APLICACIONES_VER)) return [];
  return getAplicaciones({ force, cacheScope });
}
