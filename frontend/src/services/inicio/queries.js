import { apiRequest } from "@/services/api";
import { getCachedInicioSummary } from "./cache";

export function getInicioSummary({ force = false, cacheScope = "default" } = {}) {
  return getCachedInicioSummary(
    cacheScope,
    async () => {
      const response = await apiRequest("/api/inicio");
      return response?.data || {};
    },
    { force },
  );
}
