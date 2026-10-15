import { apiRequest } from "@/services/api";
import {
  ATTENDANCE_CACHE_GROUPS,
  ATTENDANCE_CACHE_TTL,
  getCachedAttendanceData,
} from "./cache";

/**
 * Devuelve el total de horas cumplidas por un integrante, sumando
 * `minutos_realizados` de sus asistencias con estado completada o justificada.
 *
 * @param {number|string} integranteId
 * @param {{ force?: boolean, cacheScope?: string }} options
 * @returns {Promise<number>} Total de horas (redondeado a 2 decimales).
 */
export async function getIntegranteAsistenciaTotal(
  integranteId,
  { force = false, cacheScope = "default" } = {},
) {
  if (!integranteId) return 0;

  return getCachedAttendanceData(
    `member-hours:${cacheScope}:${integranteId}`,
    async () => {
      const response = await apiRequest(`/api/integrantes/${integranteId}/attendance-hours`);
      return Number(response?.data?.hours || 0);
    },
    {
      force,
      ttl: ATTENDANCE_CACHE_TTL.HISTORY,
      groups: [ATTENDANCE_CACHE_GROUPS.MEMBER_HOURS],
    },
  );
}

export async function getMiAsistenciaTotal({ force = false, cacheScope = "default" } = {}) {
  return getCachedAttendanceData(
    `member-hours:${cacheScope}:me`,
    async () => {
      const response = await apiRequest("/api/integrantes/me/attendance-hours");
      return Number(response?.data?.hours || 0);
    },
    {
      force,
      ttl: ATTENDANCE_CACHE_TTL.HISTORY,
      groups: [ATTENDANCE_CACHE_GROUPS.MEMBER_HOURS],
    },
  );
}
