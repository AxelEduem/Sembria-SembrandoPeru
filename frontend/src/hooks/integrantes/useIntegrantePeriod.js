import { useCallback, useMemo, useState } from "react";
import { QUICK_PERIODS } from "@/constants/formConstants";
import { addMonthsToDate, calculatePeriodMonths } from "@/utils/formHelpers";

export function useIntegrantePeriod(initialInicio = "", initialFin = "") {
  const [fechaInicio, setFechaInicioValue] = useState(initialInicio);
  const [fechaFin, setFechaFinValue] = useState(initialFin);

  const periodMonths = useMemo(
    () => calculatePeriodMonths(fechaInicio, fechaFin),
    [fechaInicio, fechaFin],
  );

  const activeQuickPeriod = useMemo(() => {
    if (!fechaInicio || !fechaFin) return null;

    return (
      QUICK_PERIODS.find((months) => addMonthsToDate(fechaInicio, months) === fechaFin) || null
    );
  }, [fechaInicio, fechaFin]);

  const minFechaFin = fechaInicio ? addMonthsToDate(fechaInicio, 1) : undefined;

  const setFechaInicio = useCallback((value) => {
    setFechaInicioValue(value);
  }, []);

  const setFechaFin = useCallback((value) => {
    setFechaFinValue(value);
  }, []);

  const applyQuickPeriod = useCallback((months, { disabled = false } = {}) => {
    if (disabled) return;
    if (!fechaInicio) return;
    setFechaFinValue(addMonthsToDate(fechaInicio, months));
  }, [fechaInicio]);

  const reset = useCallback(() => {
    setFechaInicioValue("");
    setFechaFinValue("");
  }, []);

  return {
    fechaInicio,
    fechaFin,
    periodMonths,
    activeQuickPeriod,
    minFechaFin,
    setFechaInicio,
    setFechaFin,
    applyQuickPeriod,
    reset,
  };
}
