import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useHorarioInstitucional } from "@/hooks/useHorarioInstitucional";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";

const TYPE_FILTERS = {
  TODOS: "todos",
  VOLUNTARIOS: "voluntarios",
  PRACTICANTES: "practicantes",
  GERENTES: "gerentes",
};

const STATUS_FILTERS = {
  TODOS: "todos",
  SIN_HORARIO: "sin_horario",
};

/* ------------------------------------------------------------------ */
/*  Sincronización de filtros con la URL                               */
/* ------------------------------------------------------------------ */

const HORARIO_PARAM_MAP = {
  view: ["vista", "tab", "view"],
  search: "q",
  typeFilter: "tipo",
  areaFilter: "area",
  cargoFilter: "cargo",
  hoursFilter: "horas",
  statusFilter: "estado",
};

const HORARIO_DEFAULTS = {
  view: "",
  search: "",
  typeFilter: "todos",
  areaFilter: "todas",
  cargoFilter: "todos",
  hoursFilter: "todas",
  statusFilter: "todos",
};

const URL_TO_VIEW = {
  listado: "listado",
  area: "area",
};

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("es-PE");
}

function matchesText(row, search) {
  if (!search) {
    return true;
  }

  return [row.nombre, row.correo].some(
    (value) =>
      String(value || "")
        .toLocaleLowerCase("es-PE")
        .includes(search),
  );
}

function matchesHours(totalHours, filter) {
  const hours = Number(totalHours || 0);

  if (filter === "todas") {
    return true;
  }

  if (filter === "10-15") {
    return hours >= 10 && hours <= 15;
  }

  if (filter === "16-20") {
    return hours > 15 && hours <= 20;
  }

  if (filter === "21+") {
    return hours > 20;
  }

  return true;
}

export function useHorarioPage() {
  const {
    allRows: hookRows,
    loading: hookLoading,
    error: hookError,
  } = useHorarioInstitucional();

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: HORARIO_PARAM_MAP,
    defaults: HORARIO_DEFAULTS,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  const initialView = useMemo(() => {
    const rawView = initialFilters.view;
    let view = URL_TO_VIEW[rawView] || "listado";

    const hasListadoFilters =
      (initialFilters.typeFilter && initialFilters.typeFilter !== "todos") ||
      (initialFilters.cargoFilter && initialFilters.cargoFilter !== "todos") ||
      (initialFilters.hoursFilter && initialFilters.hoursFilter !== "todas");

    if (!rawView && hasListadoFilters) {
      view = "listado";
    }

    return view;
  }, [initialFilters]);

  const allRows = useMemo(
    () => (Array.isArray(hookRows) ? hookRows : []),
    [hookRows],
  );
  const initialized = !hookLoading;

  const [viewMode, setViewMode] = useState(initialView);

  const [search, setSearch] = useState(() =>
    initialView === "listado" ? initialFilters.search || "" : "",
  );
  const [typeFilter, setTypeFilter] = useState(() =>
    initialView === "listado" ? initialFilters.typeFilter || TYPE_FILTERS.TODOS : TYPE_FILTERS.TODOS,
  );
  const [areaFilter, setAreaFilter] = useState(() =>
    initialView === "listado" ? initialFilters.areaFilter || "todas" : "todas",
  );
  const [cargoFilter, setCargoFilter] = useState(() =>
    initialView === "listado" && (initialFilters.areaFilter || "todas") !== "todas"
      ? initialFilters.cargoFilter || "todos"
      : "todos",
  );
  const [hoursFilter, setHoursFilter] = useState(() =>
    initialView === "listado" ? initialFilters.hoursFilter || "todas" : "todas",
  );
  const [statusFilter, setStatusFilter] = useState(() =>
    initialView === "listado" ? initialFilters.statusFilter || STATUS_FILTERS.TODOS : STATUS_FILTERS.TODOS,
  );

  const [areaViewFilter, setAreaViewFilter] = useState(() =>
    initialView === "area" ? initialFilters.areaFilter || "todas" : "todas",
  );

  const loading = hookLoading;

  const error = hookError;

  const areaOptions = useMemo(() => {
    const uniqueAreas = new Map();
    allRows.forEach((row) => {
      if (row.area_id && row.area) {
        uniqueAreas.set(String(row.area_id), { id: row.area_id, nombre: row.area });
      }
    });

    return [...uniqueAreas.values()].sort(
      (first, second) =>
        String(first.nombre || "").localeCompare(
          String(second.nombre || ""),
          "es",
        ),
    );
  }, [allRows]);

  const cargoOptions = useMemo(() => {
    if (areaFilter === "todas") return [];

    const uniqueCargos = new Map();
    allRows.forEach((row) => {
      if (row.cargo_id && row.cargo && String(row.area_id) === String(areaFilter)) {
        uniqueCargos.set(String(row.cargo_id), {
          id: row.cargo_id,
          nombre: row.cargo,
          area_id: row.area_id,
        });
      }
    });

    return [...uniqueCargos.values()]
      .sort(
        (first, second) =>
          String(first.nombre || "").localeCompare(
            String(second.nombre || ""),
            "es",
          ),
      );
  }, [allRows, areaFilter]);

  const filteredRows = useMemo(() => {
    const normalizedSearch =
      normalizeSearch(search);

    return allRows.filter((row) => {
      const matchesType =
        typeFilter ===
          TYPE_FILTERS.TODOS ||
        (typeFilter ===
          TYPE_FILTERS.VOLUNTARIOS &&
          row.tipo_integrante ===
            "voluntario") ||
        (typeFilter ===
          TYPE_FILTERS.PRACTICANTES &&
          row.tipo_integrante ===
            "practicante") ||
        (typeFilter ===
          TYPE_FILTERS.GERENTES &&
          row.tipo_integrante ===
            "gerente");

      const matchesArea =
        areaFilter === "todas" ||
        String(row.area_id) ===
          String(areaFilter);

      const matchesCargo =
        cargoFilter === "todos" ||
        String(row.cargo_id) ===
          String(cargoFilter);

      const matchesHoursResult =
        matchesHours(
          row.total_horas,
          hoursFilter,
        );

      const hasSchedule =
        Boolean(
          (row.horarios || []).length,
        );

      const matchesStatus =
        statusFilter ===
          STATUS_FILTERS.TODOS ||
        (statusFilter ===
          STATUS_FILTERS.SIN_HORARIO &&
          !hasSchedule);

      return (
        matchesText(
          row,
          normalizedSearch,
        ) &&
        matchesType &&
        matchesArea &&
        matchesCargo &&
        matchesHoursResult &&
        matchesStatus
      );
    });
  }, [
    allRows,
    areaFilter,
    cargoFilter,
    hoursFilter,
    search,
    statusFilter,
    typeFilter,
  ]);

  const hasFilters =
    Boolean(search.trim()) ||
    typeFilter !== TYPE_FILTERS.TODOS ||
    areaFilter !== "todas" ||
    cargoFilter !== "todos" ||
    hoursFilter !== "todas" ||
    statusFilter !== STATUS_FILTERS.TODOS;

  const emptyMessage = useMemo(() => {
    if (!allRows.length) {
      return "No hay horarios registrados.";
    }

    if (hasFilters) {
      return "No encontramos horarios que coincidan con tu búsqueda.";
    }

    return "No hay horarios registrados.";
  }, [allRows.length, hasFilters]);

  const areaEmptyMessage =
    "No hay horarios registrados para esta área.";

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter(
      TYPE_FILTERS.TODOS,
    );
    setAreaFilter("todas");
    setCargoFilter("todos");
    setHoursFilter("todas");
    setStatusFilter(
      STATUS_FILTERS.TODOS,
    );
  }, []);

  const handleAreaFilterChange =
    useCallback(
      (value) => {
        setAreaFilter(value);
        setCargoFilter("todos");
      },
      [],
    );

  const areaViewRows = useMemo(() => {
    if (areaViewFilter === "todas") {
      return [];
    }

    return allRows.filter(
      (row) =>
        String(row.area_id) ===
        String(areaViewFilter),
    );
  }, [allRows, areaViewFilter]);

  const filters = useMemo(
    () => ({
      areaFilter,
      areaOptions,
      cargoFilter,
      cargoOptions,
      hasFilters,
      hoursFilter,
      onAreaFilterChange:
        handleAreaFilterChange,
      onCargoFilterChange:
        setCargoFilter,
      onClearFilters:
        clearFilters,
      onHoursFilterChange:
        setHoursFilter,
      onSearchChange: setSearch,
      onStatusFilterChange:
        setStatusFilter,
      onTypeFilterChange:
        setTypeFilter,
      search,
      statusFilter,
      typeFilter,
    }),
    [
      areaFilter,
      areaOptions,
      cargoFilter,
      cargoOptions,
      clearFilters,
      handleAreaFilterChange,
      hasFilters,
      hoursFilter,
      search,
      statusFilter,
      typeFilter,
    ],
  );

  /* ------------------------------------------------------------------ */
  /*  Sync todos los filtros → URL (único efecto combinado)             */
  /* ------------------------------------------------------------------ */

  const lastSearchRef = useRef(search);
  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const isListado = viewMode === "listado";
    const isArea = viewMode === "area";

    const urlFilters = {
      view: viewMode,
      search: isListado ? search : "",
      typeFilter: isListado ? typeFilter : "todos",
      areaFilter: isArea ? areaViewFilter : isListado ? areaFilter : "todas",
      cargoFilter: isListado ? cargoFilter : "todos",
      hoursFilter: isListado ? hoursFilter : "todas",
      statusFilter: isListado ? statusFilter : "todos",
    };

    const { search: currentSearch, ...dropdowns } = urlFilters;
    const dropdownKey = JSON.stringify(dropdowns);

    const searchChanged = currentSearch !== lastSearchRef.current;
    const dropdownsChanged = dropdownKey !== dropdownFiltersRef.current;

    if (!searchChanged && !dropdownsChanged) return;

    lastSearchRef.current = currentSearch;
    if (dropdownsChanged) dropdownFiltersRef.current = dropdownKey;

    const isSearchOnly = searchChanged && !dropdownsChanged;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => {
        writeFiltersToUrl(urlFilters, { replace: isSearchOnly });
      },
      isSearchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [
    viewMode,
    search,
    typeFilter,
    areaFilter,
    areaViewFilter,
    cargoFilter,
    hoursFilter,
    statusFilter,
    writeFiltersToUrl,
  ]);

  return {
    allRows,
    loading,
    initialized,
    error,
    viewMode,
    setViewMode,
    areaOptions,
    areaViewFilter,
    setAreaViewFilter,
    areaViewRows,
    areaEmptyMessage,
    filteredRows,
    emptyMessage,
    filters,
  };
}
