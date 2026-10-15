import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

import {
  createAplicacion,
  deactivateAplicacion,
  activateAplicacion,
  getAplicacionesListCache,
  getAplicacionesByProfile,
  hasAplicacionesListCache,
  isAplicacionesListLoading,
  setAplicacionesListCache,
  subscribeAplicaciones,
  updateAplicacion,
} from "@/services/aplicaciones/aplicacionesService";
import {
  PERMISSIONS,
  getPermissionAreaId,
  getRoleId,
  hasAccessTotal,
} from "@/utils/permissions";

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

const STATUS_FILTERS = {
  TODOS: "todos",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

const STATUS_OPTIONS = [
  {
    value: STATUS_FILTERS.TODOS,
    label: "Todos los estados",
  },
  {
    value: STATUS_FILTERS.ACTIVO,
    label: "Activo",
  },
  {
    value: STATUS_FILTERS.INACTIVO,
    label: "Inactivo",
  },
];

function scopeKey(profile) {
  if (!profile) return "anon";

  const accountId = profile?.cuenta_acceso_id || profile?.id || "anon";
  const roleId = getRoleId(profile) || "anon";
  const areaId = getPermissionAreaId(profile, PERMISSIONS.APLICACIONES_VER) || "all";
  const access = hasAccessTotal(profile) ? "total" : "partial";

  return `${accountId}:${roleId}:${areaId}:${access}`;
}

export async function loadAplicacionesShared(profile, force = false) {
  const key = scopeKey(profile);
  return getAplicacionesByProfile(profile, { force, cacheScope: key });
}

function setAplicacionesCache(profile, updater, fallback = []) {
  const key = scopeKey(profile);
  const current = getAplicacionesListCache(key) || fallback;
  const next = typeof updater === "function" ? updater(current) : updater || [];
  return setAplicacionesListCache(key, next);
}

export function useAplicaciones(initialFilters = {}) {
  const { profile } = useAuth();

  const key = scopeKey(profile);

  const [aplicaciones, setAplicaciones] = useState(() => getAplicacionesListCache(key) || []);

  const [loading, setLoading] = useState(() => !hasAplicacionesListCache(key));

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState(() => initialFilters?.search ?? "");

  const [areaFilter, setAreaFilter] = useState(
    () => initialFilters?.areaFilter ?? "todas",
  );

  const [statusFilter, setStatusFilter] = useState(
    () => initialFilters?.statusFilter ?? STATUS_FILTERS.TODOS,
  );

  const [dateFilter, setDateFilter] = useState(() => initialFilters?.dateFilter ?? "");

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      const cached = getAplicacionesListCache(key);

      if (cached) {
        if (mounted) {
          setAplicaciones(cached);
          setLoading(isAplicacionesListLoading(key));
        }
        return;
      }

      if (!profile) {
        if (mounted) {
          setAplicaciones([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) {
        setLoading(true);
      }

      try {
        const data = await loadAplicacionesShared(profile, false);
        if (mounted) {
          setAplicaciones(data);
          setError("");
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || "No se pudieron actualizar las aplicaciones.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = subscribeAplicaciones(sync);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [key, profile]);

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!profile) {
        setAplicaciones([]);
        setLoading(false);
        return;
      }

      if (hasAplicacionesListCache(key)) {
        if (mounted) {
          setAplicaciones(getAplicacionesListCache(key) || []);

          setLoading(false);
        }

        return;
      }

      if (mounted) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await loadAplicacionesShared(profile, false);

        if (mounted) {
          setAplicaciones(data);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError?.message || "No se pudieron cargar las aplicaciones.");
        }
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
  }, [key, profile]);

  const refreshAplicaciones = useCallback(
    async (force = true) => {
      setLoading(true);
      setError("");

      try {
        const data = await loadAplicacionesShared(profile, force);

        setAplicaciones(data);

        return {
          success: true,
          data,
        };
      } catch (loadError) {
        const message = loadError?.message || "No se pudieron cargar las aplicaciones.";

        setError(message);

        return {
          success: false,
          message,
        };
      } finally {
        setLoading(false);
      }
    },
    [profile],
  );

  const filteredAplicaciones = useMemo(() => {
    const normalizedSearch = normalizeSearch(search);

    return aplicaciones.filter((aplicacion) => {
      const matchesSearch =
        !normalizedSearch ||
        String(aplicacion?.nombre || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesArea =
        areaFilter === "todas" || String(aplicacion?.area_id ?? "") === String(areaFilter);

      const matchesStatus =
        statusFilter === STATUS_FILTERS.TODOS ||
        (statusFilter === STATUS_FILTERS.ACTIVO && aplicacion?.activo === true) ||
        (statusFilter === STATUS_FILTERS.INACTIVO && aplicacion?.activo === false);

      const matchesDate =
        !dateFilter || String(aplicacion?.created_at || "").slice(0, 10) === dateFilter;

      return matchesSearch && matchesArea && matchesStatus && matchesDate;
    });
  }, [aplicaciones, search, areaFilter, statusFilter, dateFilter]);

  const hasFilters =
    Boolean(search.trim()) ||
    areaFilter !== "todas" ||
    statusFilter !== STATUS_FILTERS.TODOS ||
    Boolean(dateFilter);

  const createAplicacionHandler = useCallback(
    async (input) => {
      if (!profile) {
        const message = "No se encontró el perfil del usuario.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      }

      setSaving(true);
      setFeedback(null);

      try {
        const nueva = await createAplicacion(input, profile);

        const next = setAplicacionesCache(profile, (current) => [nueva, ...current], aplicaciones);

        setAplicaciones(next);

        setFeedback({
          type: "success",
          message: "Aplicación registrada correctamente.",
        });

        return {
          success: true,
          data: nueva,
        };
      } catch (err) {
        const message = err?.message || "No se pudo registrar la aplicación.";

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
    [aplicaciones, profile],
  );

  const updateAplicacionHandler = useCallback(
    async (id, input) => {
      if (!profile) {
        const message = "No se encontró el perfil del usuario.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      }

      setSaving(true);
      setFeedback(null);

      try {
        const updated = await updateAplicacion(id, input, profile);

        const next = setAplicacionesCache(
          profile,
          (current) =>
            current.map((aplicacion) => (aplicacion.id === id ? updated : aplicacion)),
          aplicaciones,
        );

        setAplicaciones(next);

        setFeedback({
          type: "success",
          message: "Aplicación actualizada correctamente.",
        });

        return {
          success: true,
          data: updated,
        };
      } catch (err) {
        const message = err?.message || "No se pudo actualizar la aplicación.";

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
    [aplicaciones, profile],
  );

  const deactivateAplicacionHandler = useCallback(
    async (id) => {
      if (!profile) {
        const message = "No se encontró el perfil del usuario.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      }

      setSaving(true);
      setFeedback(null);

      try {
        const updated = await deactivateAplicacion(id, profile);

        const next = setAplicacionesCache(
          profile,
          (current) =>
            current.map((aplicacion) =>
              aplicacion.id === id
                ? {
                    ...aplicacion,
                    ...updated,
                    activo: false,
                  }
                : aplicacion,
            ),
          aplicaciones,
        );

        setAplicaciones(next);

        setFeedback({
          type: "success",
          message: "Aplicación desactivada correctamente.",
        });

        return {
          success: true,
          data: updated,
        };
      } catch (err) {
        const message = err?.message || "No se pudo desactivar la aplicación.";

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
    [aplicaciones, profile],
  );

  const activateAplicacionHandler = useCallback(
    async (id) => {
      if (!profile) {
        const message = "No se encontró el perfil del usuario.";

        setFeedback({
          type: "error",
          message,
        });

        return {
          success: false,
          message,
        };
      }

      setSaving(true);
      setFeedback(null);

      try {
        const updated = await activateAplicacion(id, profile);

        const next = setAplicacionesCache(
          profile,
          (current) =>
            current.map((aplicacion) =>
              aplicacion.id === id
                ? {
                    ...aplicacion,
                    ...updated,
                    activo: true,
                  }
                : aplicacion,
            ),
          aplicaciones,
        );

        setAplicaciones(next);

        setFeedback({
          type: "success",
          message: "Aplicación activada correctamente.",
        });

        return {
          success: true,
          data: updated,
        };
      } catch (err) {
        const message = err?.message || "No se pudo activar la aplicación.";

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
    [aplicaciones, profile],
  );

  return {
    aplicaciones,
    filteredAplicaciones,

    loading,
    saving,
    error,
    feedback,

    search,
    areaFilter,
    statusFilter,
    dateFilter,

    statusOptions: STATUS_OPTIONS,

    hasFilters,

    setSearch,
    setAreaFilter,
    setStatusFilter,
    setDateFilter,
    setFeedback,

    refreshAplicaciones,

    createAplicacion: createAplicacionHandler,

    updateAplicacion: updateAplicacionHandler,

    deactivateAplicacion: deactivateAplicacionHandler,

    activateAplicacion: activateAplicacionHandler,
  };
}
