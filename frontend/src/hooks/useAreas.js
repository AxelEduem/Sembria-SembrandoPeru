import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  createArea,
  getAreas,
  getAreasListCache,
  hasAreasListCache,
  isAreasListLoading,
  setAreaActive,
  setAreasListCache,
  subscribeAreas,
  updateArea,
} from "@/services/areas/areasService";
import { getAreaId, getRoleId } from "@/utils/permissions";

export const AREA_STATUS_FILTERS = {
  TODAS: "todas",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

export const AREA_STATUS_OPTIONS = [
  {
    value: AREA_STATUS_FILTERS.TODAS,
    label: "Selecciona un estado",
  },
  {
    value: AREA_STATUS_FILTERS.ACTIVO,
    label: "Activo",
  },
  {
    value: AREA_STATUS_FILTERS.INACTIVO,
    label: "Inactivo",
  },
];

function getAreaScopeKey(profile) {
  const accountId = profile?.cuenta_acceso_id || profile?.id || "anon";
  const roleId = getRoleId(profile) || "anon";
  const areaId = getAreaId(profile) || "all";

  return `${accountId}:${roleId}:${areaId}`;
}

function setAreaCache(scopeKey, updater, fallback = []) {
  const current = getAreasListCache(scopeKey) || fallback;
  const next = typeof updater === "function" ? updater(current) : updater || [];
  return setAreasListCache(scopeKey, next);
}

async function loadAreasShared(scopeKey, force = false) {
  return getAreas({ force, cacheScope: scopeKey });
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

export function useAreas({ initialFilters } = {}) {
  const { profile } = useAuth();
  const scopeKey = getAreaScopeKey(profile);
  const [areas, setAreas] = useState(() => getAreasListCache(scopeKey) || []);

  const [loading, setLoading] = useState(() => !hasAreasListCache(scopeKey));

  const [error, setError] = useState("");

  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState(() => initialFilters?.search ?? "");

  const [statusFilter, setStatusFilter] = useState(() => initialFilters?.statusFilter ?? AREA_STATUS_FILTERS.TODAS);

  const [dateFilter, setDateFilter] = useState(() => initialFilters?.dateFilter ?? "");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleAreasChange = () => {
      setAreas(getAreasListCache(scopeKey) || []);
      setLoading(isAreasListLoading(scopeKey) || !hasAreasListCache(scopeKey));
    };

    return subscribeAreas(handleAreasChange);
  }, [scopeKey]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (hasAreasListCache(scopeKey)) {
        if (mounted) {
          setAreas(getAreasListCache(scopeKey) || []);
          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await loadAreasShared(scopeKey, false);

        if (!mounted) {
          return;
        }

        setAreas(data);
      } catch (loadError) {
        if (!mounted) {
          return;
        }

        setError(loadError.message || "No se pudieron cargar las áreas.");
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

  const refreshAreas = useCallback(async (force = true) => {
    setLoading(true);
    setError("");

    try {
      const data = await loadAreasShared(scopeKey, force);

      setAreas(data);

      return {
        success: true,
        data,
      };
    } catch (loadError) {
      const message = loadError.message || "No se pudieron cargar las áreas.";

      setError(message);

      return {
        success: false,
        message,
      };
    } finally {
      setLoading(false);
    }
  }, [scopeKey]);

  const filteredAreas = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return areas
      .filter((area) => {
        const matchesSearch =
          !normalizedSearch ||
          String(area.nombre ?? "")
            .toLocaleLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === AREA_STATUS_FILTERS.TODAS ||
          (statusFilter === AREA_STATUS_FILTERS.ACTIVO && area.activo) ||
          (statusFilter === AREA_STATUS_FILTERS.INACTIVO && !area.activo);

        const matchesDate = !dateFilter || getDateValue(area.created_at) === dateFilter;

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort(
        (firstArea, secondArea) =>
          getDateTime(secondArea.created_at) - getDateTime(firstArea.created_at),
      );
  }, [areas, dateFilter, search, statusFilter]);

  const handleCreateArea = useCallback(async (input) => {
    setSaving(true);
    setFeedback(null);
    setError("");

    try {
      const previousAreas = getAreasListCache(scopeKey) || areas;
      const createdArea = await createArea(input);

      const scopeCache = setAreaCache(
        scopeKey,
        (current) => [...current, createdArea],
        previousAreas,
      );

      setAreas(scopeCache);

      setFeedback({
        type: "success",
        message: "Área registrada correctamente.",
      });

      return {
        success: true,
        data: createdArea,
      };
    } catch (createError) {
      const message = createError.message || "No se pudo registrar el área.";

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
  }, [areas, scopeKey]);

  const handleUpdateArea = useCallback(async (id, input) => {
    setSaving(true);
    setFeedback(null);
    setError("");

    try {
      const previousAreas = getAreasListCache(scopeKey) || areas;
      const updatedArea = await updateArea(id, input);

      const scopeCache = setAreaCache(
        scopeKey,
        (current) =>
          current.map((area) => (String(area.id) === String(id) ? updatedArea : area)),
        previousAreas,
      );

      setAreas(scopeCache);

      setFeedback({
        type: "success",
        message: "Área actualizada correctamente.",
      });

      return {
        success: true,
        data: updatedArea,
      };
    } catch (updateError) {
      const message = updateError.message || "No se pudo actualizar el área.";

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
  }, [areas, scopeKey]);

  const handleSetAreaActive = useCallback(async (id, activo) => {
    setSaving(true);
    setFeedback(null);
    setError("");

    try {
      const previousAreas = getAreasListCache(scopeKey) || areas;
      const updatedArea = await setAreaActive(id, activo);

      const scopeCache = setAreaCache(
        scopeKey,
        (current) =>
          current.map((area) => (String(area.id) === String(id) ? updatedArea : area)),
        previousAreas,
      );

      setAreas(scopeCache);

      setFeedback({
        type: "success",
        message: activo ? "Área activada correctamente." : "Área desactivada correctamente.",
      });

      return {
        success: true,
        data: updatedArea,
      };
    } catch (statusError) {
      const message =
        statusError.message ||
        (activo ? "No se pudo activar el área." : "No se pudo desactivar el área.");

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
  }, [areas, scopeKey]);

  const hasFilters =
    Boolean(search.trim()) || statusFilter !== AREA_STATUS_FILTERS.TODAS || Boolean(dateFilter);

  return {
    areas,
    filteredAreas,
    loading,
    error,
    feedback,
    saving,
    search,
    statusFilter,
    dateFilter,
    hasFilters,
    statusOptions: AREA_STATUS_OPTIONS,
    setSearch,
    setStatusFilter,
    setDateFilter,
    setFeedback,
    refreshAreas,
    createArea: handleCreateArea,
    updateArea: handleUpdateArea,
    setAreaActive: handleSetAreaActive,
  };
}
