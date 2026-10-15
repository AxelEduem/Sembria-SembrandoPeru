import { apiRequest } from "@/services/api";
import { invalidateAttendanceScheduleCache } from "@/services/asistencia/cache";
import { invalidateAgendaDirectoryCache } from "@/services/agenda/cache";
import { clearEquiposCache } from "@/services/gestion-proyectos/equiposCache";
import { clearHorariosCache, invalidateHorariosCache } from "./cache";
import { idOf } from "./utils";
import { buildHorarioBlock, validateHorarioBlock, validateHorarioBlocks, validateMinimumWeeklyHours } from "./validation";

export async function saveHorariosIntegrante(historialId, blocks = [], { requireMinimumHours = true } = {}) {
  const id = idOf(historialId);
  const normalized = blocks.map((block) => buildHorarioBlock({ ...block, historialId: id }));
  const error = validateHorarioBlocks(normalized) || (requireMinimumHours ? validateMinimumWeeklyHours(normalized) : "");
  if (error) throw new Error(error);
  const response = await apiRequest(`/api/integrante-histories/${id}/schedules`, {
    method: "PUT", csrf: true,
    body: { blocks: normalized.map(({ dia_semana, hora_inicio, hora_fin }) => ({ dia_semana, hora_inicio, hora_fin })), require_minimum_hours: requireMinimumHours },
  });
  invalidateHorariosCache(id);
  invalidateAttendanceScheduleCache();
  invalidateAgendaDirectoryCache();
  clearEquiposCache();
  return response?.data || [];
}

export async function createHorarioBlock(block) {
  const validation = validateHorarioBlock(block);
  if (validation) throw new Error(validation);
  const historyId = idOf(block.historial_id ?? block.historialId ?? block.integrante_id ?? block.integranteId);
  const response = await apiRequest("/api/integrante-schedules", {
    method: "POST", csrf: true,
    body: { historial_id: historyId, dia_semana: block.dia_semana, hora_inicio: block.hora_inicio, hora_fin: block.hora_fin },
  });
  invalidateHorariosCache(historyId);
  invalidateAttendanceScheduleCache();
  invalidateAgendaDirectoryCache();
  clearEquiposCache();
  return response?.data;
}

export async function updateHorarioBlock(id, block) {
  const historyId = idOf(block.historial_id ?? block.historialId ?? block.integrante_id ?? block.integranteId);
  const response = await apiRequest(`/api/integrante-schedules/${Number(id)}`, {
    method: "PUT", csrf: true,
    body: { historial_id: historyId, dia_semana: block.dia_semana, hora_inicio: block.hora_inicio, hora_fin: block.hora_fin },
  });
  invalidateHorariosCache(historyId);
  invalidateAttendanceScheduleCache();
  invalidateAgendaDirectoryCache();
  clearEquiposCache();
  return response?.data;
}

export async function deleteHorarioBlock(id) {
  await apiRequest(`/api/integrante-schedules/${Number(id)}`, { method: "DELETE", csrf: true });
  clearHorariosCache();
  invalidateAttendanceScheduleCache();
  invalidateAgendaDirectoryCache();
  clearEquiposCache();
  return { success: true, id: Number(id) };
}

export async function deleteHorariosIntegrante(historialId) {
  const id = idOf(historialId);
  await apiRequest(`/api/integrante-histories/${id}/schedules`, { method: "DELETE", csrf: true });
  invalidateHorariosCache(id);
  invalidateAttendanceScheduleCache();
  invalidateAgendaDirectoryCache();
  clearEquiposCache();
  return { success: true, historial_id: id };
}
