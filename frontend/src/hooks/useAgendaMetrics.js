import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getAgendaMetrics } from "@/services/agenda/agendaService";

const EMPTY_METRICS = {
  total_reuniones: 0,
  organizadas: 0,
  como_participante: 0,
  horas_totales: 0,
  promedio_minutos: 0,
  colaboradores: 0,
  por_modalidad: [],
  por_mes: [],
};

function accountKey(profile) {
  return String(profile?.cuenta_acceso_id || profile?.id || "default");
}

export function useAgendaMetrics() {
  const { profile } = useAuth();
  const cacheScope = accountKey(profile);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");

    return getAgendaMetrics({ force: true, cacheScope })
      .then((data) => setMetrics({ ...EMPTY_METRICS, ...data }))
      .catch((requestError) => {
        setError(requestError.message || "No se pudieron cargar las métricas de reuniones.");
      })
      .finally(() => setLoading(false));
  }, [cacheScope]);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError("");
    });
    getAgendaMetrics({ cacheScope })
      .then((data) => {
        if (active) setMetrics({ ...EMPTY_METRICS, ...data });
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || "No se pudieron cargar las métricas de reuniones.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [cacheScope]);

  return { metrics, loading, error, refresh };
}
