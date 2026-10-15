import { apiRequest } from "@/services/api";
import { invalidateNotificacionesCache, NOTIFICACIONES_CACHE_GROUPS } from "./cache";

async function mutateAndInvalidate(path, options) {
  const response = await apiRequest(path, options);
  invalidateNotificacionesCache(NOTIFICACIONES_CACHE_GROUPS.LIST);
  return response;
}

export async function marcarNotificacionLeida(id) {
  return mutateAndInvalidate(`/api/notificaciones/${id}/leer`, { method: "PATCH", csrf: true });
}

export async function marcarTodasNotificacionesLeidas() {
  return mutateAndInvalidate("/api/notificaciones/leer-todas", { method: "PATCH", csrf: true });
}

export async function eliminarNotificacion(id) {
  return mutateAndInvalidate(`/api/notificaciones/${id}`, { method: "DELETE", csrf: true });
}
