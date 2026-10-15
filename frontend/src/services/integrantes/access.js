import { apiRequest } from "@/services/api";
import {
  APLICACIONES_CACHE_GROUPS,
  invalidateAplicacionesCache,
} from "@/services/aplicaciones/cache";
import {
  ACCESOS_CACHE_GROUPS,
  invalidateAccesosCache,
} from "@/services/integrantes-accesos/cache";
import {
  getCachedIntegranteData,
  INTEGRANTES_CACHE_GROUPS,
  INTEGRANTES_CACHE_TTL,
  invalidateIntegrantesCache,
} from "./cache";
import { normalizeId } from "./utils";
export { assertIntegranteAreaAccess } from "./authorization";

export async function getIntegranteAccesses(
  id,
  profile = null,
  integrante = null,
  { force = false, cacheScope = "default" } = {},
) {
  void profile;
  void integrante;
  const target = normalizeId(id);
  if (!target) throw new Error("El integrante seleccionado no es válido.");
  return getCachedIntegranteData(
    `accesses:${cacheScope}:${target}`,
    async () => {
      const response = await apiRequest(`/api/integrantes/${target}/accesses`);
      return response?.data || [];
    },
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.ACCESSES,
      groups: [INTEGRANTES_CACHE_GROUPS.ACCESSES],
    },
  );
}

export async function removeIntegranteAccess(assignmentId) {
  const id = normalizeId(assignmentId);
  await apiRequest(`/api/integrante-access-assignments/${id}`, { method: "DELETE", csrf: true });
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.ACCESSES);
  invalidateAccesosCache(ACCESOS_CACHE_GROUPS.ASIGNACIONES);
  invalidateAplicacionesCache(APLICACIONES_CACHE_GROUPS.LIST);
  return { success: true, assignmentId: id };
}

export async function getAccessCount(historialId) {
  const id = normalizeId(historialId);
  if (!id) return 0;
  const response = await apiRequest(`/api/integrante-histories/${id}/access-count`);
  return Number(response?.count || 0);
}
