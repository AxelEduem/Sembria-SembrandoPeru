import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteHistoryDetail } from "@/services/integrantes/integrantesService";
import { getPastIntegranteHistories } from "@/services/integrantes/history";

export function useIntegranteHistory() {
  const { id } = useParams();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [integrante, setIntegrante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getIntegranteHistoryDetail(id, { cacheScope })
      .then((data) => {
        if (mounted) setIntegrante(data);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError.message || "No se pudo cargar el historial del integrante.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [cacheScope, id]);

  const clearError = useCallback(() => setError(""), []);

  return {
    integrante,
    histories: getPastIntegranteHistories(integrante),
    loading,
    error,
    clearError,
  };
}
