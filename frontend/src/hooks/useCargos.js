import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getAreaId, getRoleId } from "@/utils/permissions";

import {
  createCargo,
  getCargos,
  getCargosListCache,
  hasCargosListCache,
  isCargosListLoading,
  setCargoActive,
  setCargosListCache,
  subscribeCargos,
  updateCargo,
} from "@/services/cargos/cargosService";

export const CARGO_STATUS_FILTERS = {
  TODAS: "todas",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

export const CARGO_STATUS_OPTIONS = [
  {
    value: CARGO_STATUS_FILTERS.TODAS,
    label: "Selecciona un estado",
  },
  {
    value: CARGO_STATUS_FILTERS.ACTIVO,
    label: "Activo",
  },
  {
    value: CARGO_STATUS_FILTERS.INACTIVO,
    label: "Inactivo",
  },
];

function getCargoScopeKey(profile) {
  const accountId = profile?.cuenta_acceso_id || profile?.id || "anon";
  const rol = getRoleId(profile) || "anon";
  const areaId = getAreaId(profile) || "all";

  return `${accountId}:${rol}:${areaId}`;
}

function sortCargos(rows = []) {
  return [...rows].sort((firstCargo, secondCargo) => {
    const firstDate = new Date(firstCargo?.created_at || 0).getTime();
    const secondDate = new Date(secondCargo?.created_at || 0).getTime();

    if (Number.isNaN(firstDate) || Number.isNaN(secondDate)) {
      return String(secondCargo?.nombre || "").localeCompare(String(firstCargo?.nombre || ""));
    }

    return secondDate - firstDate;
  });
}

function setCargoCache(scopeKey, updater, fallback = []) {
  const current = getCargosListCache(scopeKey) || fallback;

  const next = sortCargos(typeof updater === "function" ? updater(current) : updater || []);

  return setCargosListCache(scopeKey, next);
}

async function loadCargosShared(scopeKey, force = false) {
  return getCargos({ force, cacheScope: scopeKey });
}

function normalizeSearch(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

function getDateTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getDateValue(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function useCargos({ initialFilters } = {}) {
  const { profile } = useAuth();

  const scopeKey = getCargoScopeKey(profile);

  const [cargos, setCargos] = useState(() => getCargosListCache(scopeKey) || []);

  const [loading, setLoading] = useState(() => !hasCargosListCache(scopeKey));

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState(() => initialFilters?.search ?? "");
  const [areaFilter, setAreaFilter] = useState(() => initialFilters?.areaFilter ?? "todas");
  const [dateFilter, setDateFilter] = useState(() => initialFilters?.dateFilter ?? "");
  const [statusFilter, setStatusFilter] = useState(() => initialFilters?.statusFilter ?? CARGO_STATUS_FILTERS.TODAS);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleCargoChange = () => {
      setCargos(getCargosListCache(scopeKey) || []);

      setLoading(isCargosListLoading(scopeKey) || !hasCargosListCache(scopeKey));
    };

    return subscribeCargos(handleCargoChange);
  }, [scopeKey]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (hasCargosListCache(scopeKey)) {
        if (mounted) {
          setCargos(getCargosListCache(scopeKey) || []);
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await loadCargosShared(scopeKey, false);

        if (!mounted) {
          return;
        }

        setCargos(data);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError?.message || "No se pudieron cargar los cargos.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [scopeKey]);

  const refreshCargos = useCallback(
    async (force = true) => {
      setLoading(true);
      setError("");

      try {
        const data = await loadCargosShared(scopeKey, force);

        setCargos(data);

        return {
          success: true,
          data,
        };
      } catch (loadError) {
        const message = loadError?.message || "No se pudieron cargar los cargos.";

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    [scopeKey],
  );

  const filteredCargos = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return cargos
      .filter((cargo) => {
        const nombreCargo = String(cargo?.nombre ?? "").toLocaleLowerCase();

        const matchesSearch = !normalizedSearch || nombreCargo.includes(normalizedSearch);

        const matchesArea = areaFilter === "todas" || String(cargo?.area_id) === String(areaFilter);

        const matchesDate = !dateFilter || getDateValue(cargo?.created_at) === dateFilter;

        const matchesStatus =
          statusFilter === CARGO_STATUS_FILTERS.TODAS ||
          (statusFilter === CARGO_STATUS_FILTERS.ACTIVO && cargo?.activo === true) ||
          (statusFilter === CARGO_STATUS_FILTERS.INACTIVO && cargo?.activo === false);

        return matchesSearch && matchesArea && matchesDate && matchesStatus;
      })
      .sort(
        (firstCargo, secondCargo) =>
          getDateTime(secondCargo?.created_at) - getDateTime(firstCargo?.created_at),
      );
  }, [areaFilter, cargos, dateFilter, search, statusFilter]);

  const handleCreateCargo = useCallback(
    async (input) => {
      setSaving(true);
      setFeedback(null);
      setError("");

      try {
        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario autenticado.");
        }

        const previousCargos = getCargosListCache(scopeKey) || cargos;
        const createdCargo = await createCargo(input);

        const scopeCache = setCargoCache(
          scopeKey,
          (current) => [...current, createdCargo],
          previousCargos,
        );

        setCargos(scopeCache);

        setFeedback({
          type: "success",
          message: "Cargo registrado correctamente.",
        });

        return {
          success: true,
          data: createdCargo,
        };
      } catch (createError) {
        const message = createError?.message || "No se pudo registrar el cargo.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      } finally {
        setSaving(false);
      }
    },
    [cargos, profile, scopeKey],
  );

  const handleUpdateCargo = useCallback(
    async (id, input) => {
      setSaving(true);
      setFeedback(null);
      setError("");

      try {
        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario autenticado.");
        }

        const previousCargos = getCargosListCache(scopeKey) || cargos;
        const updatedCargo = await updateCargo(id, input);

        const scopeCache = setCargoCache(
          scopeKey,
          (current) =>
            current.map((cargo) =>
              String(cargo?.id) === String(id) ? updatedCargo : cargo,
            ),
          previousCargos,
        );

        setCargos(scopeCache);

        setFeedback({
          type: "success",
          message: "Cargo actualizado correctamente.",
        });

        return {
          success: true,
          data: updatedCargo,
        };
      } catch (updateError) {
        const message = updateError?.message || "No se pudo actualizar el cargo.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      } finally {
        setSaving(false);
      }
    },
    [cargos, profile, scopeKey],
  );

  const handleSetCargoActive = useCallback(
    async (id, activo) => {
      setSaving(true);
      setFeedback(null);
      setError("");

      try {
        if (!profile) {
          throw new Error("No se pudo obtener el perfil del usuario autenticado.");
        }

        const previousCargos = getCargosListCache(scopeKey) || cargos;
        const updatedCargo = await setCargoActive(id, activo);

        const scopeCache = setCargoCache(
          scopeKey,
          (current) =>
            current.map((cargo) =>
              String(cargo?.id) === String(id) ? updatedCargo : cargo,
            ),
          previousCargos,
        );

        setCargos(scopeCache);

        setFeedback({
          type: "success",
          message: activo ? "Cargo activado correctamente." : "Cargo desactivado correctamente.",
        });

        return {
          success: true,
          data: updatedCargo,
        };
      } catch (statusError) {
        const message =
          statusError?.message ||
          (activo ? "No se pudo activar el cargo." : "No se pudo desactivar el cargo.");

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      } finally {
        setSaving(false);
      }
    },
    [cargos, profile, scopeKey],
  );

  const hasFilters =
    Boolean(search.trim()) ||
    areaFilter !== "todas" ||
    Boolean(dateFilter) ||
    statusFilter !== CARGO_STATUS_FILTERS.TODAS;

  return {
    cargos,
    filteredCargos,
    loading,
    error,
    feedback,
    search,
    areaFilter,
    dateFilter,
    statusFilter,
    saving,
    hasFilters,

    statusOptions: CARGO_STATUS_OPTIONS,

    setSearch,
    setAreaFilter,
    setDateFilter,
    setStatusFilter,
    setFeedback,

    refreshCargos,

    createCargo: handleCreateCargo,
    updateCargo: handleUpdateCargo,
    setCargoActive: handleSetCargoActive,
  };
}
