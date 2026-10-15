import { apiRequest } from "@/services/api";
import { invalidateAgendaDirectoryCache } from "@/services/agenda/cache";
import { invalidateAttendanceMembershipCache } from "@/services/asistencia/cache";
import { clearCargosCache } from "@/services/cargos/cache";
import { clearCumpleanosCache } from "@/services/cumpleanos/cache";
import { clearHorariosCache } from "@/services/integrantes-horarios/cache";
import { clearInicioCache } from "@/services/inicio/cache";
import {
  clearIntegranteDetailCaches,
  clearIntegrantesListCache,
  INTEGRANTES_CACHE_GROUPS,
  invalidateIntegrantesCache,
} from "@/services/integrantes/cache";
import { clearScheduleChangeRequestCache } from "@/services/solicitudes-cambio-horario/cache";
import { clearUsuariosCache } from "@/services/usuarios/cache";
import { clearAreasCache } from "./cache";

function invalidateAreaConsumers() {
  clearCargosCache();
  clearIntegrantesListCache();
  clearIntegranteDetailCaches();
  clearUsuariosCache();
  clearCumpleanosCache();
  invalidateAgendaDirectoryCache();
  invalidateAttendanceMembershipCache();
  clearHorariosCache();
  clearInicioCache();
  clearScheduleChangeRequestCache();
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.CATALOGS);
}

export async function createArea(input) {
  const response = await apiRequest("/api/areas", {
    method: "POST",
    body: input,
    csrf: true,
  });

  clearAreasCache();
  clearInicioCache();
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.CATALOGS);
  return response?.data;
}

export async function updateArea(id, input) {
  const response = await apiRequest(`/api/areas/${id}`, {
    method: "PUT",
    body: input,
    csrf: true,
  });

  clearAreasCache();
  invalidateAreaConsumers();
  return response?.data;
}

export async function setAreaActive(id, activo) {
  const response = await apiRequest(`/api/areas/${id}/status`, {
    method: "PATCH",
    body: { activo },
    csrf: true,
  });

  clearAreasCache();
  invalidateAreaConsumers();
  return response?.data;
}
