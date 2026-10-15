import { apiRequest } from "@/services/api";
import { getCachedNotificaciones } from "./cache";

export async function listarNotificaciones({ force = false, cacheScope = "default" } = {}) {
  return getCachedNotificaciones(cacheScope, async () => {
    const response = await apiRequest("/api/notificaciones");
    return response?.data || [];
  }, { force });
}
