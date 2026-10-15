import { apiRequest } from "@/services/api";
import { invalidateAttendanceScheduleCache } from "@/services/asistencia/cache";
import { invalidateAgendaDirectoryCache } from "@/services/agenda/cache";
import {
  clearHorariosCache,
  validateHorarioBlocks,
  validateMinimumWeeklyHours,
} from "@/services/integrantes-horarios/integrantesHorariosService";
import { invalidateScheduleChangeRequestCache } from "./cache";

export async function crearSolicitudCambioHorario({ fechaEfectiva, motivo, bloques }) {
  const blocksError = validateHorarioBlocks(bloques);
  if (blocksError) throw new Error(blocksError);

  const minimumError = validateMinimumWeeklyHours(bloques);
  if (minimumError) throw new Error(minimumError);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (!fechaEfectiva || fechaEfectiva < tomorrow) {
    throw new Error("La fecha efectiva debe ser posterior a hoy.");
  }

  const response = await apiRequest("/api/schedule-change-requests", {
    method: "POST",
    csrf: true,
    body: {
      fecha_efectiva: fechaEfectiva,
      motivo: motivo?.trim() || null,
      blocks: bloques.map(({ dia_semana, hora_inicio, hora_fin }) => ({
        dia_semana,
        hora_inicio,
        hora_fin,
      })),
    },
  });

  invalidateScheduleChangeRequestCache();
  return response?.data || null;
}

export async function resolverSolicitudCambioHorario(id, accion, observacion = "") {
  if (["RECHAZADA", "REQUIERE_CORRECCION"].includes(accion) && !observacion.trim()) {
    throw new Error("La observación es obligatoria para esta decisión.");
  }

  const response = await apiRequest(`/api/schedule-change-requests/${id}/resolve`, {
    method: "PATCH",
    csrf: true,
    body: {
      accion,
      observacion: observacion.trim() || null,
    },
  });

  invalidateScheduleChangeRequestCache();
  if (accion === "APROBADA") {
    clearHorariosCache();
    invalidateAttendanceScheduleCache();
    invalidateAgendaDirectoryCache();
  }

  return response?.data || null;
}
