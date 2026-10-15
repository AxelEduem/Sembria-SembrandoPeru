import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getMiHistorialHorario,
  getMiHistorialHorarioParaExportar,
} from "@/services/integrantes-horarios/integrantesHorariosService";

const EMPTY_RESULT = { items: [], pagination: null };

export function useScheduleHistory({ search, status, modality, period, page, perPage }) {
  const requestKey = useMemo(
    () => JSON.stringify({ search, status, modality, period, page, perPage }),
    [search, status, modality, period, page, perPage],
  );
  const [result, setResult] = useState({ key: null, data: EMPTY_RESULT, error: "" });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    const timer = window.setTimeout(() => {
      getMiHistorialHorario({ search, status, modality, period, page, perPage })
        .then((data) => {
          if (active) setResult({ key: requestKey, data, error: "" });
        })
        .catch((requestError) => {
          if (active) {
            setResult({
              key: requestKey,
              data: EMPTY_RESULT,
              error: requestError?.message || "No se pudo cargar el historial de horario.",
            });
          }
        });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [modality, page, perPage, period, requestKey, search, status]);

  const loadAllForExport = useCallback(async () => {
    setExporting(true);

    try {
      return await getMiHistorialHorarioParaExportar({ search, status, modality, period });
    } finally {
      setExporting(false);
    }
  }, [modality, period, search, status]);

  const clearError = useCallback(() => {
    setResult((current) => ({ ...current, error: "" }));
  }, []);

  return {
    items: result.data.items,
    pagination: result.data.pagination,
    loading: result.key !== requestKey,
    error: result.key === requestKey ? result.error : "",
    exporting,
    loadAllForExport,
    clearError,
  };
}
