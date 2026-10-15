/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useIntegrantes } from "@/hooks/integrantes/useIntegrantes";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { useAuth } from "@/contexts/AuthContext";
import { getIntegranteCatalogs } from "@/services/integrantes/integrantesService";
import {
  getAreaId,
  getPermissionScope,
  hasAccessTotal,
  hasAnyPermission,
  PERMISSIONS,
} from "@/utils/permissions";

const IntegrantesContext = createContext(null);

export function IntegrantesProvider({ children }) {
  const { profile } = useAuth();

  /* ---- Permisos / alcance ---- */

  const globalScope =
    hasAccessTotal(profile) ||
    getPermissionScope(profile, PERMISSIONS.INTEGRANTES_VER) === "global";
  const areaScope = getPermissionScope(profile, PERMISSIONS.INTEGRANTES_VER) === "area";
  const profileAreaId = getAreaId(profile);
  const allowedAreaId = areaScope && !globalScope && profileAreaId ? Number(profileAreaId) : null;
  const areaLocked = Boolean(areaScope && !globalScope && allowedAreaId);

  /* ---- URL sync ---- */

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    areaLocked,
    allowedAreaId,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  /* ---- Hook principal con initializers desde URL ---- */

  const state = useIntegrantes(null, { initialFilters, paginated: true });
  const catalogScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [catalogs, setCatalogs] = useState({ areas: [], cargos: [], periodos: [] });

  useEffect(() => {
    let alive = true;

    getIntegranteCatalogs({ cacheScope: catalogScope })
      .then((data) => {
        if (alive) setCatalogs(data);
      })
      .catch(() => {
        if (alive) setCatalogs({ areas: [], cargos: [], periodos: [] });
      });

    return () => {
      alive = false;
    };
  }, [catalogScope]);

  const areas = useMemo(
    () => catalogs.areas || [],
    [catalogs.areas],
  );
  const cargos = useMemo(
    () => catalogs.cargos || [],
    [catalogs.cargos],
  );

  /* ---- Áreas / cargos permitidos según alcance ---- */

  const allowedAreas = useMemo(() => {
    const activeAreas = areas.filter((area) => area.activo !== false);
    if (!areaLocked) return activeAreas;
    return activeAreas.filter((area) => Number(area.id) === Number(allowedAreaId));
  }, [areas, areaLocked, allowedAreaId]);

  const allowedCargos = useMemo(() => {
    const activeCargos = cargos.filter((cargo) => cargo.activo !== false);
    if (!areaLocked) return activeCargos;
    return activeCargos.filter((cargo) => Number(cargo.area_id) === Number(allowedAreaId));
  }, [cargos, areaLocked, allowedAreaId]);

  // Cargos filtrados según área seleccionada en el filtro
  const filteredCargos = useMemo(() => {
    if (!state.areaFilter || state.areaFilter === "todas") {
      if (areaLocked && allowedAreaId) {
        return allowedCargos.filter((cargo) => Number(cargo.area_id) === Number(allowedAreaId));
      }
      return [];
    }
    return allowedCargos.filter((cargo) => String(cargo.area_id) === String(state.areaFilter));
  }, [allowedCargos, state.areaFilter, areaLocked, allowedAreaId]);

  /* ---- Reset cargoFilter cuando el área cambia y el cargo ya no pertenece ---- */

  useEffect(() => {
    if (state.cargoFilter === "todos") return;
    if (filteredCargos.length === 0) return;

    const cargoStillValid = filteredCargos.some(
      (cargo) => String(cargo.id) === String(state.cargoFilter),
    );

    if (!cargoStillValid) {
      state.setCargoFilter("todos");
    }
  }, [state.areaFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Sync todos los filtros → URL (único efecto) ---- */

  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);
  const lastSearchRef = useRef(state.search);

  useEffect(() => {
    const filters = {
      search: state.search,
      areaFilter: state.areaFilter,
      cargoFilter: state.cargoFilter,
      typeFilter: state.typeFilter,
      periodFilter: state.periodFilter,
      statusFilter: state.statusFilter,
      dateFilter: state.dateFilter,
    };

    const { search, ...dropdowns } = filters;
    const dropdownKey = JSON.stringify(dropdowns);

    const searchChanged = search !== lastSearchRef.current;
    const dropdownsChanged = dropdownKey !== dropdownFiltersRef.current;

    // Nada cambió → no hacer nada
    if (!searchChanged && !dropdownsChanged) return;

    lastSearchRef.current = search;
    if (dropdownsChanged) dropdownFiltersRef.current = dropdownKey;

    const isSearchOnly = searchChanged && !dropdownsChanged;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => {
        // Siempre pasamos TODOS los filtros, nunca solo uno
        writeFiltersToUrl(filters, { replace: isSearchOnly });
      },
      isSearchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [
    state.search,
    state.areaFilter,
    state.cargoFilter,
    state.typeFilter,
    state.periodFilter,
    state.statusFilter,
    state.dateFilter,
    writeFiltersToUrl,
  ]);

  /* ---- Exportar a Excel ---- */

  const canRemoveAccess = hasAnyPermission(profile, [PERMISSIONS.ACCESOS_GESTIONAR]);

  const value = {
    ...state,
    areas: allowedAreas,
    cargos: filteredCargos,
    periodOptions: (catalogs.periodos || []).map((period) => ({
      value: String(period),
      label: `${period} mes${Number(period) === 1 ? "" : "es"}`,
    })),
    areaLocked,
    allowedAreaId,
    canRemoveAccess,
  };

  return <IntegrantesContext.Provider value={value}>{children}</IntegrantesContext.Provider>;
}

export function useIntegrantesContext() {
  const context = useContext(IntegrantesContext);
  if (!context) {
    throw new Error("useIntegrantesContext debe utilizarse dentro de IntegrantesProvider.");
  }
  return context;
}
