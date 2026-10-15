import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  getInicioSummaryCache,
  isInicioSummaryLoading,
  subscribeInicio,
} from "@/services/inicio/cache";
import { getInicioSummary } from "@/services/inicio/queries";

const INITIAL_SUMMARY = {
  integrantes_activos: 0,
  areas_activas: 0,
  usuarios_conectados: 0,
};
const REFRESH_INTERVAL_MS = 60_000;

function useInicioData() {
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [summary, setSummary] = useState(() => ({
    ...INITIAL_SUMMARY,
    ...getInicioSummaryCache(cacheScope),
  }));
  const [loading, setLoading] = useState(
    () => getInicioSummaryCache(cacheScope) === null,
  );
  const [error, setError] = useState("");

  const load = useCallback(async ({ force = false } = {}) => {
    try {
      const data = await getInicioSummary({ force, cacheScope });
      setSummary({ ...INITIAL_SUMMARY, ...data });
      setError("");
      return { success: true, data };
    } catch (requestError) {
      const message =
        requestError.message || "No se pudieron cargar los indicadores de inicio.";
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [cacheScope]);

  useEffect(() => {
    let active = true;

    getInicioSummary({ cacheScope })
      .then((data) => {
        if (!active) return;
        setSummary({ ...INITIAL_SUMMARY, ...data });
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.message || "No se pudieron cargar los indicadores de inicio.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const intervalId = window.setInterval(
      () => load({ force: true }),
      REFRESH_INTERVAL_MS,
    );

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [cacheScope, load]);

  useEffect(() => {
    const sync = () => {
      const cached = getInicioSummaryCache(cacheScope);
      if (cached) {
        setSummary({ ...INITIAL_SUMMARY, ...cached });
      }
      setLoading(isInicioSummaryLoading(cacheScope));
    };

    return subscribeInicio(sync);
  }, [cacheScope]);

  const recargarResumen = useCallback(() => {
    setLoading(true);
    return load({ force: true });
  }, [load]);

  return {
    summary,
    areasActivas: summary.areas_activas,
    usuariosConectados: summary.usuarios_conectados,
    error,
    summaryLoading: loading,
    areasLoading: loading,
    recargarResumen,
  };
}

export default useInicioData;
