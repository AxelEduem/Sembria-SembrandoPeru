import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getEquipoMetricsCache, getEquiposCache } from "@/services/gestion-proyectos/equiposCache";
import { getEquipoMetricsSources } from "@/services/gestion-proyectos/equiposMetricsData";

export default function useEquipoMetrics() {
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [snapshot, setSnapshot] = useState(() => getEquipoMetricsCache(cacheScope));
  const [snapshotScope, setSnapshotScope] = useState(cacheScope);
  const [loading, setLoading] = useState(() => getEquipoMetricsCache(cacheScope) === null);
  const [error, setError] = useState("");

  const refresh = useCallback(async ({ force = true } = {}) => {
    if (!snapshot) setLoading(true);
    setError("");
    try {
      const next = await getEquipoMetricsSources({ force, cacheScope });
      setSnapshot(next);
      setSnapshotScope(cacheScope);
      return next;
    } catch (requestError) {
      setError(requestError.message || "No se pudieron cargar las métricas de equipos.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [cacheScope, snapshot]);

  useEffect(() => {
    let active = true;
    const cached = getEquipoMetricsCache(cacheScope);
    getEquipoMetricsSources({ cacheScope, force: cached !== null })
      .then((next) => {
        if (!active) return;
        setSnapshot(next);
        setSnapshotScope(cacheScope);
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "No se pudieron cargar las métricas de equipos.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheScope]);

  const visibleSnapshot = snapshotScope === cacheScope ? snapshot : null;

  return {
    equipos: visibleSnapshot?.equipos || getEquiposCache(cacheScope) || [],
    convocatorias: visibleSnapshot?.convocatorias || [],
    loading: snapshotScope !== cacheScope || loading,
    error,
    refresh,
  };
}
