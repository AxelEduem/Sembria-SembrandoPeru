import { apiRequest } from "@/services/api";
import { loadBitacoraCached, loadBitacoraMetricsCached } from "./cache";

function queryString(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== "todos") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getBitacora(filters = {}, { force = false, cacheScope = "default" } = {}) {
  return loadBitacoraCached(filters, () => apiRequest(`/api/bitacora${queryString(filters)}`), {
    force,
    cacheScope,
  });
}

export function exportBitacora(filters) {
  return apiRequest(`/api/bitacora/exportar${queryString(filters)}`);
}

export function getBitacoraMetrics({ force = false, cacheScope = "default" } = {}) {
  return loadBitacoraMetricsCached(() => apiRequest("/api/bitacora/metricas"), {
    force,
    cacheScope,
  });
}
