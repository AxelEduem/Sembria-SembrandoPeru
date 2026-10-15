import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

const FILTER_PARAM_MAP = {
  search: "q",
  areaFilter: "area",
  cargoFilter: "cargo",
  typeFilter: "tipo",
  periodFilter: "periodo",
  statusFilter: "estado",
  dateFilter: "fecha",
};

const DEFAULTS = {
  search: "",
  areaFilter: "todas",
  cargoFilter: "todos",
  typeFilter: "todos",
  periodFilter: "todos",
  statusFilter: "todos",
  dateFilter: "",
};

export default function useUrlSyncedFilters({
  areaLocked = false,
  allowedAreaId = null,
  paramMap = FILTER_PARAM_MAP,
  defaults = DEFAULTS,
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const readInitialFilters = useCallback(() => {
    const filters = {};

    Object.entries(paramMap).forEach(([key, param]) => {
      const value = searchParams.get(param);

      filters[key] =
        value !== null
          ? value
          : defaults[key];
    });

    if (areaLocked && allowedAreaId) {
      filters.areaFilter = String(allowedAreaId);
    }

    return filters;
  }, [searchParams, paramMap, defaults, areaLocked, allowedAreaId]);

  const writeFiltersToUrl = useCallback(
    (filters, { replace = true } = {}) => {
      const params = new URLSearchParams();

      Object.entries(paramMap).forEach(([key, param]) => {
        let value = filters?.[key];

        if (value === undefined || value === null) {
          value = defaults[key];
        }

        value = String(value);

        const defaultValue = String(defaults[key] ?? "");

        if (value !== defaultValue && value !== "") {
          params.set(param, value);
        }
      });

      if (areaLocked) {
        params.delete(paramMap.areaFilter || "area");
      }

      const current = searchParams.toString();
      const next = params.toString();

      if (current === next) {
        return;
      }

      setSearchParams(params, { replace });
    },
    [
      searchParams,
      setSearchParams,
      paramMap,
      defaults,
      areaLocked,
    ],
  );

  return {
    readInitialFilters,
    writeFiltersToUrl,
  };
}