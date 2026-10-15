import { apiRequest } from "@/services/api";
import { invalidateAgendaDirectoryCache } from "@/services/agenda/cache";
import { invalidateAttendanceMembershipCache } from "@/services/asistencia/cache";
import { clearCumpleanosCache } from "@/services/cumpleanos/cache";
import { clearHorariosCache } from "@/services/integrantes-horarios/cache";
import {
  clearIntegranteDetailCaches,
  clearIntegrantesListCache,
  INTEGRANTES_CACHE_GROUPS,
  invalidateIntegrantesCache,
} from "@/services/integrantes/cache";
import { clearScheduleChangeRequestCache } from "@/services/solicitudes-cambio-horario/cache";
import { clearUsuariosCache } from "@/services/usuarios/cache";
import { clearCargosCache } from "./cache";

function invalidateCargoConsumers() {
  clearIntegrantesListCache();
  clearIntegranteDetailCaches();
  clearUsuariosCache();
  clearCumpleanosCache();
  invalidateAgendaDirectoryCache();
  invalidateAttendanceMembershipCache();
  clearHorariosCache();
  clearScheduleChangeRequestCache();
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.CATALOGS);
}

export async function createCargo(input) {
  const response = await apiRequest("/api/cargos", {
    method: "POST",
    body: input,
    csrf: true,
  });

  clearCargosCache();
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.CATALOGS);
  return response?.data;
}

export async function updateCargo(id, input) {
  const response = await apiRequest(`/api/cargos/${id}`, {
    method: "PUT",
    body: input,
    csrf: true,
  });

  clearCargosCache();
  invalidateCargoConsumers();
  return response?.data;
}

export async function setCargoActive(id, activo) {
  const response = await apiRequest(`/api/cargos/${id}/status`, {
    method: "PATCH",
    body: { activo },
    csrf: true,
  });

  clearCargosCache();
  invalidateCargoConsumers();
  return response?.data;
}
