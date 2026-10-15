import { apiRequest } from "@/services/api";
import { loadEquipoMetricsCached } from "@/services/gestion-proyectos/equiposCache";

export function getEquipoMetricsSources({ force = false, cacheScope = "default" } = {}) {
  return loadEquipoMetricsCached(async () => {
    const response = await apiRequest("/api/gestion-proyectos/equipos/metricas");
    return response?.data || { equipos: [], convocatorias: [] };
  }, { force, cacheScope });
}

export function prefetchEquipoMetrics(cacheScope = "default") {
  return getEquipoMetricsSources({ cacheScope });
}
