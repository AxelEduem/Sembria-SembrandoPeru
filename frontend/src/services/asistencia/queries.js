import { apiRequest } from "@/services/api";
import {
  ATTENDANCE_CACHE_GROUPS as GROUPS,
  ATTENDANCE_CACHE_TTL as TTL,
  getCachedAttendanceData,
} from "./cache";

export async function getBloquesHoy({ force = false } = {}) {
  return getCachedAttendanceData("personal:today", async () => {
    const response = await apiRequest("/api/mi-asistencia");
    return response?.data || [];
  }, { force, ttl: TTL.VOLATILE, groups: [GROUPS.PERSONAL_TODAY] });
}

export async function getSeguimientoJornadas(fecha, { force = false } = {}) {
  const params = new URLSearchParams({ fecha });
  return getCachedAttendanceData(`admin:tracking:${fecha}`, async () => {
    const response = await apiRequest(`/api/asistencia/seguimiento?${params}`);
    return response?.data || [];
  }, { force, ttl: TTL.VOLATILE, groups: [GROUPS.ADMIN_TRACKING] });
}

export async function getMetricasAsistencia(desde, hasta, { force = false } = {}) {
  const params = new URLSearchParams({ desde, hasta });
  return getCachedAttendanceData(`admin:metrics:${desde}:${hasta}`, async () => {
    const response = await apiRequest(`/api/asistencia/metricas?${params}`);
    return response?.data || {};
  }, { force, ttl: TTL.WORKFLOWS, groups: [GROUPS.ADMIN_METRICS] });
}

export async function getCalendarioAsistencia(desde, hasta, { force = false } = {}) {
  const params = new URLSearchParams({ desde, hasta });
  return getCachedAttendanceData(`calendar:${desde}:${hasta}`, async () => {
    const response = await apiRequest(`/api/asistencia/calendario?${params}`);
    return response?.data || [];
  }, { force, ttl: TTL.HISTORY, groups: [GROUPS.CALENDAR] });
}

export async function getAmonestacionesAsistencia({ force = false } = {}) {
  return getCachedAttendanceData("admin:warnings", async () => {
    const response = await apiRequest("/api/asistencia/amonestaciones");
    return response?.data || [];
  }, { force, ttl: TTL.WORKFLOWS, groups: [GROUPS.ADMIN_WARNINGS] });
}

export async function getMiHistorial(limit = 1000, { force = false } = {}) {
  return getCachedAttendanceData(`personal:history:${limit}`, async () => {
    const response = await apiRequest(`/api/mi-asistencia/historial?limit=${limit}`);
    return response?.data || [];
  }, { force, ttl: TTL.HISTORY, groups: [GROUPS.PERSONAL_HISTORY] });
}

export async function getMisFlujosAsistencia({ force = false } = {}) {
  return getCachedAttendanceData("personal:workflows", async () => {
    const response = await apiRequest("/api/mi-asistencia/solicitudes");
    return response?.data || {};
  }, { force, ttl: TTL.WORKFLOWS, groups: [GROUPS.PERSONAL_WORKFLOWS] });
}

export async function getFlujosAsistencia(section = "solicitudes", { force = false } = {}) {
  const params = new URLSearchParams({ seccion: section });
  return getCachedAttendanceData(`admin:workflows:${section}`, async () => {
    const response = await apiRequest(`/api/asistencia/flujos?${params}`);
    return response?.data || {};
  }, { force, ttl: TTL.WORKFLOWS, groups: [GROUPS.ADMIN_WORKFLOWS] });
}

export async function estimarPermiso(fechas, { force = false } = {}) {
  const params = new URLSearchParams();
  fechas.forEach((fecha) => params.append("fechas[]", fecha));
  const dateKey = fechas.join(":");
  return getCachedAttendanceData(`personal:leave-estimate:${dateKey}`, async () => {
    const response = await apiRequest(`/api/mi-asistencia/permisos/estimar?${params}`);
    return response?.data?.minutos || 0;
  }, { force, ttl: TTL.CALCULATION, groups: [GROUPS.LEAVE_CALCULATIONS] });
}

export async function proponerRecuperacionPermiso(fechas, dias, { force = false } = {}) {
  const params = new URLSearchParams({ dias: String(dias) });
  fechas.forEach((fecha) => params.append("fechas[]", fecha));
  const key = `personal:leave-suggestion:${fechas.join(":")}:${dias}`;
  return getCachedAttendanceData(key, async () => {
    const response = await apiRequest(`/api/mi-asistencia/permisos/proponer-recuperacion?${params}`);
    return response?.data || { minutos: 0, recuperaciones: [] };
  }, { force, ttl: TTL.CALCULATION, groups: [GROUPS.LEAVE_CALCULATIONS] });
}

export async function proponerRecuperacionIncidencia(minutos, desde, dias) {
  const params = new URLSearchParams({ minutos: String(minutos), desde, dias: String(dias) });
  const response = await apiRequest(`/api/mi-asistencia/recuperaciones/proponer?${params}`);
  return response?.data || { minutos: 0, recuperaciones: [] };
}
