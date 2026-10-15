import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import {
  createIntegrante,
  getIntegranteAccesses,
  removeIntegranteAccess,
  restoreIntegrante,
  rehireIntegrante,
  setIntegranteInactive,
  updateIntegrante,
  loadIntegrantes,
  getIntegrantesCache,
  clearIntegrantesListCache,
  subscribeIntegrantes,
  patchIntegranteInList,
  getIntegrantesPage,
} from "@/services/integrantes/integrantesService";

export const STATUS_FILTERS = {
  TODOS: "todos",
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

export const STATUS_OPTIONS = [
  { value: STATUS_FILTERS.TODOS, label: "Todos los estados" },
  { value: STATUS_FILTERS.ACTIVO, label: "Activo" },
  { value: STATUS_FILTERS.INACTIVO, label: "Inactivo" },
];

function getDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase();
}

function getCurrentRows(rows) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = `${row.persona_id || `integrante-${row.id}`}|${row.tipo_integrante || ""}`;
    const current = grouped.get(key);

    if (
      !current ||
      (row.activo && !current.activo) ||
      getDateTime(row.created_at) > getDateTime(current.created_at)
    ) {
      grouped.set(key, row);
    }
  });

  return [...grouped.values()];
}

export function useIntegrantes(
  tipoIntegrante = null,
  { initialFilters, conCuenta = false, paginated = false } = {},
) {
  const { profile } = useAuth();
  const profileId = profile?.id || null;
  const baseScope = profile?.cuenta_acceso_id || profileId || "default";

  const cacheScope = conCuenta ? `${baseScope}:conCuenta` : baseScope;

  const [rows, setRows] = useState(() => (paginated ? [] : getIntegrantesCache(cacheScope) || []));
  const [loading, setLoading] = useState(() => paginated || getIntegrantesCache(cacheScope) === null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 5,
    total: 0,
    from: 0,
    to: 0,
  });

  const [search, setSearch] = useState(() => initialFilters?.search ?? "");
  const [areaFilter, setAreaFilter] = useState(() => initialFilters?.areaFilter ?? "todas");
  const [cargoFilter, setCargoFilter] = useState(() => initialFilters?.cargoFilter ?? "todos");
  const [typeFilter, setTypeFilter] = useState(() => initialFilters?.typeFilter ?? "todos");
  const [periodFilter, setPeriodFilter] = useState(() => initialFilters?.periodFilter ?? "todos");
  const [statusFilter, setStatusFilter] = useState(
    () => initialFilters?.statusFilter ?? STATUS_FILTERS.TODOS,
  );
  const [dateFilter, setDateFilter] = useState(() => initialFilters?.dateFilter ?? "");

  const exportFilters = useMemo(
    () => ({
      search,
      areaFilter,
      cargoFilter,
      typeFilter,
      periodFilter,
      statusFilter,
      dateFilter,
      tipoIntegrante,
      conCuenta,
    }),
    [
      areaFilter,
      cargoFilter,
      conCuenta,
      dateFilter,
      periodFilter,
      search,
      statusFilter,
      tipoIntegrante,
      typeFilter,
    ],
  );
  const filterKey = JSON.stringify(exportFilters);
  const lastFilterKeyRef = useRef(filterKey);

  const clearError = useCallback(() => setError(""), []);

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      if (paginated) {
        setReloadVersion((version) => version + 1);
        return { success: true, data: rows };
      }

      setLoading(true);
      setError("");

      try {
        const next = await loadIntegrantes({ force, cacheScope, conCuenta });   // ← conCuenta
        setRows(next || []);
        return { success: true, data: next || [] };
      } catch (loadError) {
        const message = loadError.message || "No se pudieron cargar los integrantes.";
        setError(message);
        return { success: false, message, data: [] };
      } finally {
        setLoading(false);
      }
    },
    [cacheScope, conCuenta, paginated, rows],
  );

  useEffect(() => {
    if (paginated) return undefined;

    let alive = true;

    const cached = getIntegrantesCache(cacheScope);
    if (cached !== null) return undefined;

    loadIntegrantes({ cacheScope, conCuenta })
      .then((next) => {
        if (!alive) return;
        setRows(next || []);
        setLoading(false);
      })
      .catch((loadError) => {
        if (!alive) return;
        setError(loadError.message || "No se pudieron cargar los integrantes.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [cacheScope, conCuenta, paginated]);

  useEffect(() => {
    if (paginated) return undefined;

    const unsubscribe = subscribeIntegrantes(() => {
      const cached = getIntegrantesCache(cacheScope);
      if (cached !== null) {
        setRows(cached);
      }
    });

    return unsubscribe;
  }, [cacheScope, paginated]);

  useEffect(() => {
    if (!paginated) return undefined;

    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey;
      if (page !== 1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPage(1);
        return undefined;
      }
    }

    let alive = true;
    const timer = window.setTimeout(
      () => {
        setLoading(true);
        setError("");

        getIntegrantesPage({
          ...exportFilters,
          page,
          perPage: pagination.perPage,
          cacheScope,
          force: reloadVersion > 0,
        })
          .then((result) => {
            if (!alive) return;
            setRows(result.data);
            setPagination(result.pagination);
          })
          .catch((loadError) => {
            if (!alive) return;
            setRows([]);
            setError(loadError.message || "No se pudieron cargar los integrantes.");
          })
          .finally(() => {
            if (alive) setLoading(false);
          });
      },
      search.trim() ? 300 : 0,
    );

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cacheScope, exportFilters, filterKey, page, paginated, pagination.perPage, reloadVersion, search]);

  const integrantes = useMemo(
    () => paginated
      ? rows
      : getCurrentRows(rows).filter(
          (row) => !tipoIntegrante || row.tipo_integrante === tipoIntegrante,
        ),
    [paginated, rows, tipoIntegrante],
  );

  const filteredIntegrantes = useMemo(() => {
    if (paginated) return integrantes;

    const normalizedSearch = normalizeSearch(search);

    return integrantes
      .filter((row) => {
        const nombre = normalizeSearch(row.nombre);
        const correo = normalizeSearch(row.correo);
        const documentoIdentidad = normalizeSearch(row.documento_identidad);
        const telefono = normalizeSearch(row.telefono);

        const matchesSearch =
          !normalizedSearch ||
          nombre.includes(normalizedSearch) ||
          correo.includes(normalizedSearch) ||
          documentoIdentidad.includes(normalizedSearch) ||
          telefono.includes(normalizedSearch);

        const matchesArea = areaFilter === "todas" || String(row.area_id) === String(areaFilter);
        const matchesCargo =
          cargoFilter === "todos" || String(row.cargo_id) === String(cargoFilter);
        const matchesType =
          typeFilter === "todos" || String(row.tipo_integrante) === String(typeFilter);
        const matchesPeriod =
          periodFilter === "todos" || String(row.periodo_meses || "") === String(periodFilter);
        const matchesStatus =
          statusFilter === STATUS_FILTERS.TODOS ||
          (statusFilter === STATUS_FILTERS.ACTIVO && row.activo) ||
          (statusFilter === STATUS_FILTERS.INACTIVO && !row.activo);
        const matchesDate = !dateFilter || String(row.created_at || "").slice(0, 10) === dateFilter;

        return (
          matchesSearch &&
          matchesArea &&
          matchesCargo &&
          matchesType &&
          matchesPeriod &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((first, second) => getDateTime(second.created_at) - getDateTime(first.created_at));
  }, [
    areaFilter,
    cargoFilter,
    dateFilter,
    integrantes,
    periodFilter,
    search,
    statusFilter,
    typeFilter,
    paginated,
  ]);

  const periodOptions = useMemo(() => {
    const periods = [
      ...new Set(integrantes.map((row) => Number(row.periodo_meses)).filter(Boolean)),
    ];

    return periods
      .sort((first, second) => first - second)
      .map((period) => ({
        value: String(period),
        label: `${period} mes${period === 1 ? "" : "es"}`,
      }));
  }, [integrantes]);

  const withSaving = useCallback(
    async (action, successMessage, fallbackMessage, { invalidate = true, patch = null } = {}) => {
      setSaving(true);
      setFeedback(null);
      setError("");

      try {
        const result = await action();

        if (paginated) {
          setReloadVersion((version) => version + 1);
        } else if (patch && result?.id) {
          patchIntegranteInList(result.id, (row) => patch(row, result));
        } else if (invalidate) {
          clearIntegrantesListCache({ notify: true });
        }

        setFeedback({ type: "success", message: successMessage });

        return { success: true, data: result, integrante: result };
      } catch (actionError) {
        const message = actionError.message || fallbackMessage;
        setError(message);
        setFeedback({ type: "error", message });
        return { success: false, message };
      } finally {
        setSaving(false);
      }
    },
    [paginated],
  );

  const create = useCallback(
    (input, typeOverride = null) => {
      const targetType = typeOverride || tipoIntegrante;

      return withSaving(
        () => createIntegrante(input, targetType, profile),
        targetType === "practicante"
          ? "Practicante creado correctamente."
          : targetType === "gerente"
            ? "Gerente creado correctamente."
            : targetType === "voluntario"
              ? "Voluntario creado correctamente."
              : "Integrante creado correctamente.",
        "No se pudo registrar el integrante.",
      );
    },
    [tipoIntegrante, profile, withSaving],
  );

  const update = useCallback(
    (id, input) =>
      withSaving(
        () => updateIntegrante(id, input, tipoIntegrante, profile),
        tipoIntegrante === "practicante"
          ? "Practicante actualizado correctamente."
          : tipoIntegrante === "gerente"
            ? "Gerente actualizado correctamente."
            : tipoIntegrante === "voluntario"
              ? "Voluntario actualizado correctamente."
              : "Integrante actualizado correctamente.",
        "No se pudo actualizar el integrante.",
      ),
    [tipoIntegrante, profile, withSaving],
  );

  const deactivate = useCallback(
    (id, reason) =>
      withSaving(
        () => setIntegranteInactive(id, profile?.id, reason, profile),
        "Integrante desactivado correctamente.",
        "No se pudo desactivar el integrante.",
        { patch: (_row, result) => result },
      ),
    [profile, withSaving],
  );

  const restore = useCallback(
    (id) =>
      withSaving(
        () => restoreIntegrante(id, profile),
        "Integrante activado correctamente.",
        "No se pudo activar el integrante.",
        { patch: (_row, result) => result },
      ),
    [profile, withSaving],
  );

  const rehire = useCallback(
    (id, input) =>
      withSaving(
        () => rehireIntegrante(id, input, tipoIntegrante, profile),
        "Integrante recontratado correctamente.",
        "No se pudo recontratar el integrante.",
      ),
    [tipoIntegrante, profile, withSaving],
  );

  const removeAccess = useCallback(
    async (id) => {
      setSaving(true);
      setFeedback(null);
      setError("");

      try {
        await removeIntegranteAccess(id, profile);

        setFeedback({ type: "success", message: "El acceso fue retirado del sistema." });
        return { success: true };
      } catch (removeError) {
        const message = removeError.message || "No se pudo quitar el acceso.";
        setError(message);
        setFeedback({ type: "error", message });
        return { success: false, message };
      } finally {
        setSaving(false);
      }
    },
    [profile],
  );

  const validateAccesses = useCallback(
    async (id) => {
      try {
        const accesses = await getIntegranteAccesses(id, profile, null, { force: true });
        return { success: true, accesses: accesses || [] };
      } catch (accessError) {
        const message = accessError.message || "No se pudieron validar los accesos del integrante.";
        setFeedback({ type: "error", message });
        return { success: false, message, accesses: [] };
      }
    },
    [profile],
  );

  return {
    integrantes,
    filteredIntegrantes,

    loading,
    saving,
    error,
    feedback,

    search,
    areaFilter,
    cargoFilter,
    typeFilter,
    periodFilter,
    statusFilter,
    dateFilter,
    page,
    pagination,
    exportFilters,

    statusOptions: STATUS_OPTIONS,
    periodOptions,

    hasFilters:
      Boolean(search.trim()) ||
      areaFilter !== "todas" ||
      cargoFilter !== "todos" ||
      typeFilter !== "todos" ||
      periodFilter !== "todos" ||
      statusFilter !== STATUS_FILTERS.TODOS ||
      Boolean(dateFilter),

    setSearch,
    setAreaFilter,
    setCargoFilter,
    setTypeFilter,
    setPeriodFilter,
    setStatusFilter,
    setDateFilter,
    setPage,
    setFeedback,
    clearError,

    refreshIntegrantes: refresh,

    createIntegrante: create,
    updateIntegrante: update,
    deactivateIntegrante: deactivate,
    restoreIntegrante: restore,
    rehireIntegrante: rehire,
    removeIntegranteAccess: removeAccess,
    validateIntegranteAccesses: validateAccesses,
  };
}
