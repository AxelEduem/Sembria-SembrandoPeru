import { apiRequest } from "@/services/api";
import {
  getCachedScheduleChangeData,
  SCHEDULE_CHANGE_CACHE_GROUPS as GROUPS,
  SCHEDULE_CHANGE_CACHE_TTL as TTL,
} from "./cache";

function withParams(path, values = {}) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.size ? `${path}?${params}` : path;
}

function normalizeCreationEligibility(response) {
  const eligibility = response?.creation_eligibility;
  const hasPending = Boolean(response?.has_pending);

  if (eligibility) {
    return {
      canCreate: Boolean(eligibility.can_create),
      reason: eligibility.reason || null,
      availableFrom: eligibility.available_from || null,
      message: eligibility.message || null,
    };
  }

  return {
    canCreate: !hasPending,
    reason: hasPending ? "pending" : null,
    availableFrom: null,
    message: hasPending
      ? "Ya tienes una solicitud de cambio de horario pendiente."
      : null,
  };
}

export async function getMiCambioHorarioEligibility({ force = false } = {}) {
  return getCachedScheduleChangeData("personal:eligibility", async () => {
    const response = await apiRequest(
      withParams("/api/schedule-change-requests/mine", {
        por_pagina: 1,
      }),
    );

    return normalizeCreationEligibility(response);
  }, {
    force,
    ttl: TTL.ELIGIBILITY,
    groups: [GROUPS.ELIGIBILITY],
  });
}

export async function getMisSolicitudesCambioHorario({
  search = "",
  status = "todos",
  period = "todos",
  page = 1,
  perPage = 6,
  force = false,
} = {}) {
  const normalizedSearch = search.trim();
  const key = `personal:list:${JSON.stringify({
    search: normalizedSearch,
    status,
    period,
    page,
    perPage,
  })}`;

  return getCachedScheduleChangeData(key, async () => {
    const response = await apiRequest(
      withParams("/api/schedule-change-requests/mine", {
        q: normalizedSearch,
        estado: status === "todos" ? "" : status,
        periodo: period === "todos" ? "" : period,
        pagina: page,
        por_pagina: perPage,
      }),
    );

    return {
      items: response?.data || [],
      pagination: response?.meta || null,
      hasPending: Boolean(response?.has_pending),
      creationEligibility: normalizeCreationEligibility(response),
    };
  }, {
    force,
    ttl: TTL.LIST,
    groups: [GROUPS.PERSONAL, GROUPS.ELIGIBILITY],
  });
}

export async function getMisSolicitudesCambioHorarioParaExportar({
  search = "",
  status = "todos",
  period = "todos",
  force = false,
} = {}) {
  const firstPage = await getMisSolicitudesCambioHorario({
    search,
    status,
    period,
    page: 1,
    perPage: 50,
    force,
  });
  const lastPage = firstPage.pagination?.last_page || 1;

  if (lastPage === 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      getMisSolicitudesCambioHorario({
        search,
        status,
        period,
        page: index + 2,
        perPage: 50,
        force,
      }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((result) => result.items);
}

export async function getSolicitudesCambioHorario(estado = "", { force = false } = {}) {
  const normalizedStatus = estado.trim();
  return getCachedScheduleChangeData(`admin:list:${normalizedStatus || "all"}`, async () => {
    const response = await apiRequest(
      withParams("/api/schedule-change-requests", { estado: normalizedStatus }),
    );
    return response?.data || [];
  }, {
    force,
    ttl: TTL.LIST,
    groups: [GROUPS.ADMIN],
  });
}
