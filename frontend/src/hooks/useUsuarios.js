import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAreas } from "@/hooks/useAreas";
import { useCargos } from "@/hooks/useCargos";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import {
  configurarAccesoIntegrante,
  getUsuariosIntegrantes,
  reenviarCredencialesIntegrante,
  actualizarCorreoIntegrante,
} from "@/services/usuarios/usuariosService";
import { getUsuariosCache } from "@/services/usuarios/cache";

const USUARIOS_PARAM_MAP = {
  viewMode: "vista",
  search: "q",
  areaFilter: "area",
  cargoFilter: "cargo",
  typeFilter: "tipo",
  dateFilter: "fecha",
};

const USUARIOS_DEFAULTS = {
  viewMode: "con_acceso",
  search: "",
  areaFilter: "todas",
  cargoFilter: "todos",
  typeFilter: "todos",
  dateFilter: "",
};

async function loadShared(force = false) {
  return getUsuariosIntegrantes({ force });
}
export function useUsuarios() {
  const { areas, loading: loadingAreas } = useAreas();
  const { cargos, loading: loadingCargos } = useCargos();
  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: USUARIOS_PARAM_MAP,
    defaults: USUARIOS_DEFAULTS,
  });
  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);
  const [usuarios, setUsuarios] = useState(() => getUsuariosCache() || []);
  const [loading, setLoading] = useState(() => !getUsuariosCache());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState(() =>
    initialFilters.viewMode === "sin_acceso" ? "sin_acceso" : "con_acceso",
  );
  const [search, setSearch] = useState(() => initialFilters.search || "");
  const [areaFilter, setAreaFilter] = useState(() => initialFilters.areaFilter || "todas");
  const [cargoFilter, setCargoFilter] = useState(() => initialFilters.cargoFilter || "todos");
  const [typeFilter, setTypeFilter] = useState(() => initialFilters.typeFilter || "todos");
  const [dateFilter, setDateFilter] = useState(() => initialFilters.dateFilter || "");

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    try {
      const rows = await loadShared(force);
      setUsuarios(rows);
      return rows;
    } catch (loadError) {
      setError(loadError?.message || "No se pudieron cargar los usuarios.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const viewUsuarios = useMemo(
    () =>
      usuarios.filter((row) =>
        viewMode === "sin_acceso" ? !row.acceso_configurado : row.acceso_configurado,
      ),
    [usuarios, viewMode],
  );

  const areaOptions = useMemo(() => {
    return areas
      .filter((area) => area.activo !== false)
      .sort((first, second) =>
        String(first.nombre).localeCompare(String(second.nombre), "es"),
      );
  }, [areas]);

  const cargoOptions = useMemo(() => {
    if (areaFilter === "todas") return [];

    return cargos
      .filter(
        (cargo) =>
          cargo.activo !== false && String(cargo.area_id) === String(areaFilter),
      )
      .sort((first, second) =>
        String(first.nombre).localeCompare(String(second.nombre), "es"),
      );
  }, [areaFilter, cargos]);

  const handleAreaFilterChange = useCallback((value) => {
    setAreaFilter(value);
    setCargoFilter("todos");
  }, []);

  const handleViewModeChange = useCallback((value) => {
    setViewMode(value === "sin_acceso" ? "sin_acceso" : "con_acceso");
    setAreaFilter("todas");
    setCargoFilter("todos");
    setTypeFilter("todos");
    setDateFilter("");
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setAreaFilter("todas");
    setCargoFilter("todos");
    setTypeFilter("todos");
    setDateFilter("");
  }, []);

  useEffect(() => {
    let active = true;
    loadShared(false)
      .then((rows) => active && setUsuarios(rows))
      .catch(
        (loadError) =>
          active && setError(loadError?.message || "No se pudieron cargar los usuarios."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const filteredUsuarios = useMemo(() => {
    const query = search.trim().toLowerCase();
    return viewUsuarios.filter((row) => {
      const matchesSearch =
        !query ||
        row.nombre.toLowerCase().includes(query) ||
        row.correo.toLowerCase().includes(query);
      const matchesArea =
        areaFilter === "todas" || String(row.area_id) === String(areaFilter);
      const matchesCargo =
        cargoFilter === "todos" || String(row.cargo_id) === String(cargoFilter);
      const matchesType =
        typeFilter === "todos" || String(row.tipo_integrante) === String(typeFilter);
      const matchesDate =
        !dateFilter || String(row.created_at || "").slice(0, 10) === dateFilter;
      return (
        matchesSearch &&
        matchesArea &&
        matchesCargo &&
        matchesType &&
        matchesDate
      );
    });
  }, [areaFilter, cargoFilter, dateFilter, search, typeFilter, viewUsuarios]);

  const configureAccess = useCallback(
    async (values) => {
      setSaving(true);
      try {
        const result = await configurarAccesoIntegrante(values);
        await refresh(true);
        return { success: true, data: result };
      } catch (saveError) {
        return {
          success: false,
          message: saveError?.message || "No se pudo configurar el acceso.",
        };
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const resendCredentials = useCallback(
  async ({ integranteId, enviarCorreo }) => {
    setSaving(true);
    try {
      const result = await reenviarCredencialesIntegrante(integranteId, enviarCorreo);
      await refresh(true);
      return { success: true, data: result };
    } catch (saveError) {
      return {
        success: false,
        message: saveError?.message || "No se pudieron reenviar las credenciales.",
      };
    } finally {
      setSaving(false);
    }
  },
  [refresh],
);

const updateEmail = useCallback(
  async ({ integranteId, correo }) => {
    setSaving(true);
    try {
      const result = await actualizarCorreoIntegrante({ integranteId, correo });
      await refresh(true);
      return { success: true, data: result };
    } catch (saveError) {
      return {
        success: false,
        message: saveError?.message || "No se pudo actualizar el correo.",
      };
    } finally {
      setSaving(false);
    }
  },
  [refresh],
);

  const hasFilters =
    Boolean(search.trim()) ||
    areaFilter !== "todas" ||
    cargoFilter !== "todos" ||
    typeFilter !== "todos" ||
    Boolean(dateFilter);

  const lastSearchRef = useRef(search);
  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const filters = { viewMode, search, areaFilter, cargoFilter, typeFilter, dateFilter };
    const { search: currentSearch, ...dropdowns } = filters;
    const dropdownKey = JSON.stringify(dropdowns);
    const searchChanged = currentSearch !== lastSearchRef.current;
    const dropdownsChanged = dropdownKey !== dropdownFiltersRef.current;

    if (!searchChanged && !dropdownsChanged) return;

    lastSearchRef.current = currentSearch;
    if (dropdownsChanged) dropdownFiltersRef.current = dropdownKey;

    const isSearchOnly = searchChanged && !dropdownsChanged;
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => writeFiltersToUrl(filters, { replace: isSearchOnly }),
      isSearchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [areaFilter, cargoFilter, dateFilter, search, typeFilter, viewMode, writeFiltersToUrl]);

  return {
    usuarios,
    filteredUsuarios,
    loading,
    saving,
    error,
    clearError: () => setError(""),
    viewMode,
    setViewMode: handleViewModeChange,
    search,
    areaFilter,
    areaOptions,
    loadingAreas,
    cargoFilter,
    cargoOptions,
    loadingCargos,
    typeFilter,
    dateFilter,
    hasFilters,
    setSearch,
    setAreaFilter: handleAreaFilterChange,
    setCargoFilter,
    setTypeFilter,
    setDateFilter,
    clearFilters,
    refresh,
    configureAccess,
    resendCredentials,
    updateEmail, 
  };
}
