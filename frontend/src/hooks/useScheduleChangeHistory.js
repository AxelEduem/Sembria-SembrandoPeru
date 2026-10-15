import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMisSolicitudesCambioHorario,
  getMisSolicitudesCambioHorarioParaExportar,
} from "@/services/solicitudes-cambio-horario/solicitudesCambioHorarioService";

const EMPTY_RESULT = {
  items: [],
  pagination: null,
  hasPending: false,
  creationEligibility: {
    canCreate: true,
    reason: null,
    availableFrom: null,
    message: null,
  },
};

export function useScheduleChangeHistory({ search, status, period, page, perPage }) {
  const requestKey = useMemo(
    () => JSON.stringify({ search, status, period, page, perPage }),
    [search, status, period, page, perPage],
  );
  const [result, setResult] = useState({
    key: null,
    data: EMPTY_RESULT,
    error: "",
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      getMisSolicitudesCambioHorario({ search, status, period, page, perPage })
        .then((data) => {
          if (active) setResult({ key: requestKey, data, error: "" });
        })
        .catch((requestError) => {
          if (active) {
            setResult({
              key: requestKey,
              data: EMPTY_RESULT,
              error:
                requestError?.message ||
                "No se pudo cargar el historial de solicitudes.",
            });
          }
        });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [page, perPage, period, requestKey, search, status]);

  const loadAllForExport = useCallback(async () => {
    setExporting(true);

    try {
      return await getMisSolicitudesCambioHorarioParaExportar({ search, status, period });
    } finally {
      setExporting(false);
    }
  }, [period, search, status]);

  const clearError = useCallback(() => {
    setResult((current) => ({ ...current, error: "" }));
  }, []);

  return {
    items: result.data.items,
    pagination: result.data.pagination,
    hasPending: result.data.hasPending,
    creationEligibility: result.data.creationEligibility,
    loading: result.key !== requestKey,
    error: result.key === requestKey ? result.error : "",
    exporting,
    loadAllForExport,
    clearError,
  };
}
