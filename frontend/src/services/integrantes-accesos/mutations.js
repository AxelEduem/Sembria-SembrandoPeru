import { apiRequest } from "@/services/api";
import {
  APLICACIONES_CACHE_GROUPS,
  invalidateAplicacionesCache,
} from "@/services/aplicaciones/cache";
import { ACCESOS_CACHE_GROUPS, invalidateAccesosCache } from "./cache";
import {
  INTEGRANTES_CACHE_GROUPS,
  invalidateIntegrantesCache,
} from "@/services/integrantes/cache";
import { requireAccesosAssign, requireAccesosRevoke } from "./authorization";
import { idOf } from "./utils";

export async function assignAplicacionToVoluntario(applicationId, historialId, profile = null) {
  requireAccesosAssign(profile);
  const response = await apiRequest("/api/integrante-access-assignments", {
    method: "POST",
    csrf: true,
    body: {
      aplicacion_id: idOf(applicationId, "La aplicación seleccionada"),
      historial_id: idOf(historialId, "El integrante seleccionado"),
    },
  });
  invalidateAccesosCache(ACCESOS_CACHE_GROUPS.ASIGNACIONES);
  invalidateAplicacionesCache(APLICACIONES_CACHE_GROUPS.LIST);
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.ACCESSES);
  return response?.data || response;
}

export async function revokeAplicacionFromVoluntario(assignmentId, profile = null) {
  requireAccesosRevoke(profile);
  const id = idOf(assignmentId, "La asignación seleccionada");
  await apiRequest(`/api/integrante-access-assignments/${id}`, { method: "DELETE", csrf: true });
  invalidateAccesosCache(ACCESOS_CACHE_GROUPS.ASIGNACIONES);
  invalidateAplicacionesCache(APLICACIONES_CACHE_GROUPS.LIST);
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.ACCESSES);
}

export const assignAplicacionToIntegrante = assignAplicacionToVoluntario;
export const revokeAplicacionFromIntegrante = revokeAplicacionFromVoluntario;
