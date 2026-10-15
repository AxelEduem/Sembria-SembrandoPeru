import { apiRequest } from "@/services/api";
import {
  getCachedScheduleData,
  getHorariosIntegrante,
  SCHEDULE_CACHE_GROUPS,
  SCHEDULE_CACHE_TTL,
} from "@/services/integrantes-horarios/integrantesHorariosService";
import {
  getCachedIntegranteData,
  INTEGRANTES_CACHE_GROUPS,
  INTEGRANTES_CACHE_TTL,
} from "./cache";
import { normalizeId } from "./utils";

function listParams({
  search,
  areaFilter,
  cargoFilter,
  typeFilter,
  periodFilter,
  statusFilter,
  dateFilter,
  tipoIntegrante,
  conCuenta = false,
  page,
  perPage,
} = {}) {
  const params = new URLSearchParams();
  const query = String(search || "").trim();

  if (query) params.set("q", query);
  if (areaFilter && areaFilter !== "todas") params.set("area", areaFilter);
  if (cargoFilter && cargoFilter !== "todos") params.set("cargo", cargoFilter);
  if (typeFilter && typeFilter !== "todos") params.set("tipo", typeFilter);
  else if (tipoIntegrante) params.set("tipo_integrante", tipoIntegrante);
  if (periodFilter && periodFilter !== "todos") params.set("periodo", periodFilter);
  if (statusFilter && statusFilter !== "todos") params.set("estado", statusFilter);
  if (dateFilter) params.set("fecha", dateFilter);
  if (conCuenta) params.set("con_cuenta", "1");
  if (page) params.set("pagina", String(page));
  if (perPage) params.set("por_pagina", String(perPage));

  return params;
}

async function fetchIntegrantesPage(filters) {
  const params = listParams(filters);
  const response = await apiRequest(`/api/integrantes?${params}`);

  return {
    data: response?.data || [],
    pagination: {
      currentPage: Number(response?.meta?.current_page) || 1,
      lastPage: Number(response?.meta?.last_page) || 1,
      perPage: Number(response?.meta?.per_page) || filters.perPage,
      total: Number(response?.meta?.total) || 0,
      from: Number(response?.meta?.from) || 0,
      to: Number(response?.meta?.to) || 0,
    },
  };
}

export function getIntegrantesPage({ force = false, cacheScope = "default", ...filters } = {}) {
  const query = listParams(filters).toString();

  return getCachedIntegranteData(
    `list:${cacheScope}:page:${query}`,
    () => fetchIntegrantesPage(filters),
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.LIST,
      groups: [INTEGRANTES_CACHE_GROUPS.LIST],
    },
  );
}

export async function exportIntegrantes(filters = {}) {
  const params = listParams(filters);
  const response = await apiRequest(`/api/integrantes/exportar${params.size ? `?${params}` : ""}`);

  return response?.data || [];
}

export async function fetchIntegrantesWithHistoriales({ tipoIntegrante, inactive, conCuenta } = {}) {
  const params = new URLSearchParams();
  if (tipoIntegrante) params.set("tipo_integrante", tipoIntegrante);
  if (typeof inactive === "boolean") params.set("inactive", inactive ? "1" : "0");
  if (conCuenta) params.set("con_cuenta", "1");
  const response = await apiRequest(`/api/integrantes${params.size ? `?${params}` : ""}`);
  return response?.data || [];
}

export async function getIntegrantes({
  tipoIntegrante,
  inactive,
  conCuenta = false,
  force = false,
  cacheScope = "default",
} = {}) {
  const queryKey = new URLSearchParams({
    tipo: tipoIntegrante || "all",
    inactive: typeof inactive === "boolean" ? String(inactive) : "all",
    conCuenta: conCuenta ? "1" : "0",
  }).toString();
  const normalizedQuery = queryKey === "tipo=all&inactive=all&conCuenta=0" ? "all" : queryKey;

  return getCachedIntegranteData(
    `list:${cacheScope}:${normalizedQuery}`,
    () => fetchIntegrantesWithHistoriales({ tipoIntegrante, inactive, conCuenta }),
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.LIST,
      groups: [INTEGRANTES_CACHE_GROUPS.LIST],
      notify: true,
    },
  );
}

export function loadIntegrantes({ force = false, cacheScope = "default", conCuenta = false } = {}) {
  return getIntegrantes({ force, cacheScope, conCuenta });
}

async function fetchIntegranteById(id) {
  const response = await apiRequest(`/api/integrantes/${id}`);
  return response?.data || null;
}

export async function getIntegranteById(
  id,
  { force = false, cacheScope = "default" } = {},
) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) throw new Error("El integrante seleccionado no es válido.");

  return getCachedIntegranteData(
    `detail:${cacheScope}:${normalizedId}`,
    () => fetchIntegranteById(normalizedId),
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.DETAIL,
      groups: [INTEGRANTES_CACHE_GROUPS.DETAIL],
    },
  );
}

export async function getIntegranteHistory(
  integrante,
  { force = false, cacheScope = "default" } = {},
) {
  const id = normalizeId(integrante?.id);
  if (!id) return [];
  if (!force && integrante?.historiales?.length) return integrante.historiales;

  return getCachedIntegranteData(
    `history:${cacheScope}:${id}`,
    async () => {
      const refreshed = await getIntegranteById(id, { force: true, cacheScope });
      return refreshed?.historiales || [];
    },
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.HISTORY,
      groups: [INTEGRANTES_CACHE_GROUPS.HISTORY],
    },
  );
}

export async function getIntegranteHistoryDetail(
  id,
  { force = false, cacheScope = "default" } = {},
) {
  const normalizedId = normalizeId(id);
  if (!normalizedId) throw new Error("El integrante seleccionado no es válido.");

  return getCachedIntegranteData(
    `history-detail:${cacheScope}:${normalizedId}`,
    async () => {
      const response = await apiRequest(`/api/integrantes/${normalizedId}/history`);
      return response?.data || null;
    },
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.HISTORY,
      groups: [INTEGRANTES_CACHE_GROUPS.HISTORY],
    },
  );
}

export function getIntegranteCatalogs({ force = false, cacheScope = "default" } = {}) {
  return getCachedIntegranteData(
    `catalogs:${cacheScope}`,
    async () => {
      const response = await apiRequest("/api/integrantes/catalogs");
      return response?.data || { areas: [], cargos: [] };
    },
    {
      force,
      ttl: INTEGRANTES_CACHE_TTL.CATALOGS,
      groups: [INTEGRANTES_CACHE_GROUPS.CATALOGS],
    },
  );
}

export async function getMiHorario({ force = false, cacheScope = "default" } = {}) {
  return getCachedScheduleData(`personal-current:${cacheScope}`, async () => {
    const response = await apiRequest("/api/integrantes/me");
    const integrante = response?.data || null;
    if (!integrante) return { integrante: null, horarios: [] };

    const historial = integrante.historial_actual || integrante.historiales?.[0];
    const horarios = historial?.id
      ? await getHorariosIntegrante(historial.id, { force })
      : [];

    return { integrante, horarios };
  }, {
    force,
    ttl: SCHEDULE_CACHE_TTL.CURRENT,
    groups: [SCHEDULE_CACHE_GROUPS.CURRENT],
  });
}
