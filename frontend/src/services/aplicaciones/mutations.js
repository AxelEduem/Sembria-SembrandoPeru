import { apiRequest } from "@/services/api";
import {
  ACCESOS_CACHE_GROUPS,
  invalidateAccesosCache,
} from "@/services/integrantes-accesos/cache";
import { clearInicioCache } from "@/services/inicio/cache";
import {
  INTEGRANTES_CACHE_GROUPS,
  invalidateIntegrantesCache,
} from "@/services/integrantes/cache";
import { clearAplicacionesCache } from "./cache";

function invalidateAplicacionConsumers() {
  clearAplicacionesCache();
  invalidateAccesosCache(ACCESOS_CACHE_GROUPS.ASIGNACIONES);
  invalidateIntegrantesCache(INTEGRANTES_CACHE_GROUPS.ACCESSES);
  clearInicioCache();
}

function toFormData(input, method = null) {
  const data = new FormData();
  data.append("nombre", input?.nombre || "");
  data.append("descripcion", input?.descripcion || "");
  data.append("licencias_total", String(input?.licencias_total ?? ""));

  if (Object.hasOwn(input || {}, "area_id")) {
    data.append("area_id", input?.area_id == null ? "" : String(input.area_id));
  }

  if (input?.logo_file instanceof File) {
    data.append("logo_file", input.logo_file);
  }

  if (method) data.append("_method", method);

  return data;
}

export async function createAplicacion(input) {
  const response = await apiRequest("/api/aplicaciones", {
    method: "POST",
    body: toFormData(input),
    csrf: true,
  });

  invalidateAplicacionConsumers();
  return response?.data;
}

export async function updateAplicacion(id, input) {
  const response = await apiRequest(`/api/aplicaciones/${id}`, {
    method: "POST",
    body: toFormData(input, "PUT"),
    csrf: true,
  });

  invalidateAplicacionConsumers();
  return response?.data;
}

export async function setAplicacionActive(id, activo) {
  const response = await apiRequest(`/api/aplicaciones/${id}/status`, {
    method: "PATCH",
    body: { activo },
    csrf: true,
  });

  invalidateAplicacionConsumers();
  return response?.data;
}

export function deactivateAplicacion(id) {
  return setAplicacionActive(id, false);
}

export function activateAplicacion(id) {
  return setAplicacionActive(id, true);
}
