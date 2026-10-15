import { apiRequest } from "@/services/api";
import {
  getCachedScheduleData,
  SCHEDULE_CACHE_GROUPS as GROUPS,
  SCHEDULE_CACHE_TTL as TTL,
} from "./cache";
import { idOf } from "./utils";
import { sortHorarioBlocks } from "./validation";

function withParams(path, values = {}) {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params.size ? `${path}?${params}` : path;
}

export async function getHorariosIntegrante(historialId, { force = false } = {}) {
  const id = idOf(historialId);
  return getCachedScheduleData(`blocks:${id}`, async () => {
    const response = await apiRequest(`/api/integrante-histories/${id}/schedules`);
    return sortHorarioBlocks(response?.data || []);
  }, {
    force,
    ttl: TTL.BLOCKS,
    groups: [GROUPS.BLOCKS],
  });
}

export async function getMiHistorialHorario({
  search = "",
  status = "todos",
  modality = "todas",
  period = "todos",
  page = 1,
  perPage = 6,
  force = false,
} = {}) {
  const normalizedSearch = search.trim();
  const key = `personal-history:${JSON.stringify({
    search: normalizedSearch,
    status,
    modality,
    period,
    page,
    perPage,
  })}`;

  return getCachedScheduleData(key, async () => {
    const response = await apiRequest(
      withParams("/api/integrantes/me/schedule-history", {
        q: normalizedSearch,
        estado: status === "todos" ? "" : status,
        modalidad: modality === "todas" ? "" : modality,
        periodo: period === "todos" ? "" : period,
        pagina: page,
        por_pagina: perPage,
      }),
    );

    return {
      items: response?.data || [],
      pagination: response?.meta || null,
    };
  }, {
    force,
    ttl: TTL.HISTORY,
    groups: [GROUPS.PERSONAL_HISTORY],
  });
}

export async function getMiHistorialHorarioParaExportar(filters = {}) {
  const firstPage = await getMiHistorialHorario({ ...filters, page: 1, perPage: 50 });
  const lastPage = firstPage.pagination?.last_page || 1;

  if (lastPage === 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      getMiHistorialHorario({ ...filters, page: index + 2, perPage: 50 }),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((result) => result.items);
}
