import { apiRequest } from "@/services/api";
import {
  ATTENDANCE_CACHE_GROUPS as GROUPS,
  invalidateAttendanceCache,
} from "./cache";

const ATTENDANCE_RECORD_GROUPS = [
  GROUPS.PERSONAL_TODAY,
  GROUPS.PERSONAL_HISTORY,
  GROUPS.ADMIN_TRACKING,
  GROUPS.ADMIN_METRICS,
  GROUPS.MEMBER_HOURS,
];
const WORKFLOW_GROUPS = [GROUPS.PERSONAL_WORKFLOWS, GROUPS.ADMIN_WORKFLOWS];

async function mutatePersonal(path, method, body) {
  const response = await apiRequest(path, { method, body, csrf: true });
  return response?.data ?? response;
}

async function mutateAndInvalidate(path, method, body, groups) {
  const result = await mutatePersonal(path, method, body);
  invalidateAttendanceCache(groups);
  return result;
}

const OFFLINE_KEY = "sembria_attendance_offline_queue";

function queueOffline(path, method, body) {
  const current = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  const item = {
    id: crypto.randomUUID(), path, method,
    body: {
      ...body,
      ocurrido_en: body.ocurrido_en || new Date().toISOString(),
      client_event_id: body.client_event_id || crypto.randomUUID(),
    },
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(OFFLINE_KEY, JSON.stringify([...current, item]));
  return item;
}

async function mutateWithOffline(path, method, body, fallback, groups) {
  if (!navigator.onLine) {
    const queued = queueOffline(path, method, body);
    invalidateAttendanceCache(groups);
    return { ...fallback, queued: true, client_event_id: queued.body.client_event_id };
  }
  return mutateAndInvalidate(path, method, body, groups);
}

export async function sincronizarAsistenciaPendiente() {
  const queue = JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
  const pending = [];
  for (const item of queue) {
    try {
      await mutatePersonal(item.path, item.method, item.body);
    } catch {
      pending.push(item);
      if (!navigator.onLine) break;
    }
  }
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(pending));
  if (queue.length !== pending.length) {
    invalidateAttendanceCache(ATTENDANCE_RECORD_GROUPS);
  }
  return { synchronized: queue.length - pending.length, pending: pending.length };
}

export const iniciarAsistencia = (horarioId) =>
  mutateWithOffline("/api/mi-asistencia/iniciar", "POST", { horario_id: horarioId }, { horario_id: horarioId, estado: "pendiente_offline" }, ATTENDANCE_RECORD_GROUPS);

export const iniciarAsistenciaConMotivo = (
  horarioId,
  motivo,
  recuperaciones = [],
  ocurridoEn = null,
) =>
  mutateWithOffline("/api/mi-asistencia/iniciar", "POST", {
    horario_id: horarioId,
    motivo: motivo || null,
    recuperaciones,
    ocurrido_en: ocurridoEn,
  }, { horario_id: horarioId, estado: "pendiente_offline" }, [...ATTENDANCE_RECORD_GROUPS, ...WORKFLOW_GROUPS]);

export const terminarAsistencia = (id, input) =>
  mutateWithOffline(`/api/mi-asistencia/${id}/terminar`, "PATCH", input, { id, estado: "en_jornada" }, ATTENDANCE_RECORD_GROUPS);

export const terminarAsistenciaAnticipada = (id, input) => {
  if (!input.adjunto) {
    return mutateWithOffline(
      `/api/mi-asistencia/${id}/terminar`,
      "PATCH",
      input,
      { id, estado: "en_jornada" },
      [...ATTENDANCE_RECORD_GROUPS, ...WORKFLOW_GROUPS],
    );
  }
  const form = new FormData();
  form.append("_method", "PATCH");
  form.append("descripcion", input.descripcion);
  form.append("motivo_salida", input.motivo_salida);
  if (input.ocurrido_en) form.append("ocurrido_en", input.ocurrido_en);
  if (input.adjunto) form.append("adjunto", input.adjunto);
  (input.recuperaciones || []).forEach((row, index) => {
    Object.entries(row).forEach(([key, value]) => form.append(`recuperaciones[${index}][${key}]`, value));
  });
  return mutateAndInvalidate(`/api/mi-asistencia/${id}/terminar`, "POST", form, [...ATTENDANCE_RECORD_GROUPS, ...WORKFLOW_GROUPS]);
};

export const solicitarPermiso = (formData) => mutateAndInvalidate(
  "/api/mi-asistencia/permisos", "POST", formData, WORKFLOW_GROUPS,
);
export const guardarConfiguracionAsistencia = (input) => mutateAndInvalidate(
  "/api/asistencia/configuracion", "PATCH", input,
  [GROUPS.ADMIN_WORKFLOWS, GROUPS.LEAVE_CALCULATIONS, GROUPS.PERSONAL_TODAY, GROUPS.ADMIN_TRACKING],
);
export const registrarDiaNoLaborable = (input) => mutateAndInvalidate(
  "/api/asistencia/dias-no-laborables", "POST", input,
  [GROUPS.ADMIN_WORKFLOWS, GROUPS.LEAVE_CALCULATIONS, GROUPS.CALENDAR, GROUPS.PERSONAL_TODAY, GROUPS.PERSONAL_HISTORY, GROUPS.ADMIN_TRACKING, GROUPS.ADMIN_METRICS],
);
export const eliminarDiaNoLaborable = (id) => mutateAndInvalidate(
  `/api/asistencia/dias-no-laborables/${id}`, "DELETE", undefined,
  [GROUPS.ADMIN_WORKFLOWS, GROUPS.LEAVE_CALCULATIONS, GROUPS.CALENDAR, GROUPS.PERSONAL_TODAY, GROUPS.PERSONAL_HISTORY, GROUPS.ADMIN_TRACKING, GROUPS.ADMIN_METRICS],
);
export const actualizarTratamientoDiaNoLaborable = (id, requiereAsistencia, motivo = null) => mutateAndInvalidate(
  `/api/asistencia/dias-no-laborables/${id}/tratamiento`, "PATCH",
  { requiere_asistencia: requiereAsistencia, motivo },
  [GROUPS.ADMIN_WORKFLOWS, GROUPS.LEAVE_CALCULATIONS, GROUPS.CALENDAR, GROUPS.PERSONAL_TODAY, GROUPS.PERSONAL_HISTORY, GROUPS.ADMIN_TRACKING, GROUPS.ADMIN_METRICS],
);
export const resolverPermiso = (id, estado, observacion) => mutateAndInvalidate(
  `/api/asistencia/permisos/${id}/resolver`, "PATCH",
  { estado, observacion: observacion || null },
  [...WORKFLOW_GROUPS, ...ATTENDANCE_RECORD_GROUPS],
);
export const resolverApelacion = (id, estado, observacion) => mutateAndInvalidate(
  `/api/asistencia/apelaciones/${id}/resolver`, "PATCH",
  { estado, observacion: observacion || null },
  [...WORKFLOW_GROUPS, GROUPS.ADMIN_WARNINGS],
);
export const cerrarAsistenciaAdministrativamente = (id, input) => mutateAndInvalidate(
  `/api/asistencia/${id}/cierre-administrativo`, "PATCH", input, ATTENDANCE_RECORD_GROUPS,
);
export const iniciarRecuperacion = (
  id,
  motivo = "",
  recuperaciones = [],
  ocurridoEn = null,
) => mutateAndInvalidate(
  `/api/mi-asistencia/recuperaciones/${id}/iniciar`, "POST",
  { motivo: motivo || null, recuperaciones, ocurrido_en: ocurridoEn },
  [...WORKFLOW_GROUPS, GROUPS.ADMIN_METRICS],
);
export const terminarRecuperacion = (id, descripcion) => mutateAndInvalidate(
  `/api/mi-asistencia/recuperaciones/${id}/terminar`, "PATCH", { descripcion },
  [...WORKFLOW_GROUPS, GROUPS.ADMIN_METRICS],
);

export const crearJustificacion = (id, formData) =>
  mutateAndInvalidate(
    `/api/mi-asistencia/${id}/justificaciones`, "POST", formData,
    [GROUPS.PERSONAL_TODAY, GROUPS.PERSONAL_HISTORY, GROUPS.ADMIN_WORKFLOWS, GROUPS.ADMIN_TRACKING],
  );

export const resolverJustificacion = (id, estado, observacion, gravedadAmonestacion = null) =>
  mutateAndInvalidate(`/api/asistencia/justificaciones/${id}/resolver`, "PATCH", {
    estado,
    observacion: observacion || null,
    gravedad_amonestacion: gravedadAmonestacion,
  }, [...ATTENDANCE_RECORD_GROUPS, ...WORKFLOW_GROUPS, GROUPS.ADMIN_WARNINGS]);
export const resolverSalidaAnticipada = resolverJustificacion;
