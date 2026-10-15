import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const CONVOCATORIAS_FILTER_DEFAULTS = {
  search: "", fuente: "", sector: "", estado: "", etapa: "", elegibilidad: "", cierre: "",
};
export const CONVOCATORIA_PROCESS_DEFAULT = "registro";

const FILTER_PARAM_MAP = { search: "q", fuente: "fuente", sector: "sector", estado: "estado", etapa: "etapa", elegibilidad: "elegibilidad", cierre: "cierre" };

export default function useConvocatoriasUrlFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const readInitialFilters = useCallback(() => Object.entries(FILTER_PARAM_MAP).reduce((filters, [key, param]) => {
    filters[key] = searchParams.get(param) ?? CONVOCATORIAS_FILTER_DEFAULTS[key];
    return filters;
  }, {}), [searchParams]);
  const readInitialProcess = useCallback(() => searchParams.get("proceso") || CONVOCATORIA_PROCESS_DEFAULT, [searchParams]);
  const writeFiltersToUrl = useCallback((filters, process = CONVOCATORIA_PROCESS_DEFAULT, { replace = false } = {}) => {
    const params = new URLSearchParams();
    Object.entries(FILTER_PARAM_MAP).forEach(([key, param]) => {
      const value = String(filters[key] ?? CONVOCATORIAS_FILTER_DEFAULTS[key]);
      if (value !== CONVOCATORIAS_FILTER_DEFAULTS[key]) params.set(param, value);
    });
    if (process !== CONVOCATORIA_PROCESS_DEFAULT) params.set("proceso", process);
    if (params.toString() !== searchParams.toString()) setSearchParams(params, { replace });
  }, [searchParams, setSearchParams]);
  return { readInitialFilters, readInitialProcess, writeFiltersToUrl };
}
