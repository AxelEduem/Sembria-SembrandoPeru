import { apiRequest } from "@/services/api";
import { clearUsuariosCache } from "@/services/usuarios/cache";
import { clearAgendaCache } from "@/services/agenda/cache";
import { invalidateAttendanceMembershipCache } from "@/services/asistencia/cache";
import { clearCumpleanosCache } from "@/services/cumpleanos/cache";
import { clearHorariosCache } from "@/services/integrantes-horarios/cache";
import { clearInicioCache } from "@/services/inicio/cache";
import { clearAccesosCache } from "@/services/integrantes-accesos/cache";
import { clearScheduleChangeRequestCache } from "@/services/solicitudes-cambio-horario/cache";
import { clearEquiposCache } from "@/services/gestion-proyectos/equiposCache";
import { clearIntegranteDetailCaches, clearIntegrantesListCache } from "./cache";
import { normalizeId } from "./utils";

function invalidate(id, { clearList = true } = {}) {
  clearIntegranteDetailCaches(id);
  if (clearList) clearIntegrantesListCache({ notify: false });
  clearUsuariosCache();
  clearAgendaCache();
  clearCumpleanosCache();
  invalidateAttendanceMembershipCache();
  clearHorariosCache();
  clearInicioCache();
  clearScheduleChangeRequestCache();
  clearAccesosCache();
  clearEquiposCache();
}

async function mutate(path, { method = "POST", body } = {}) {
  const response = await apiRequest(path, { method, body, csrf: true });
  return response?.data ?? response;
}

export async function createIntegrante(input, type) {
  const result = await mutate("/api/integrantes", { body: { ...input, tipo_integrante: type } });
  invalidate();
  return result;
}

export async function updateIntegrante(id, input, type) {
  const target = normalizeId(id);
  const result = await mutate(`/api/integrantes/${target}`, { method: "PUT", body: { ...input, tipo_integrante: type } });
  invalidate(target);
  return result;
}

export async function setIntegranteInactive(id, _coordinatorId, reason) {
  const target = normalizeId(id);
  const result = await mutate(`/api/integrantes/${target}/deactivate`, { body: { motivo: reason } });
  invalidate(target, { clearList: false });
  return result;
}

export async function restoreIntegrante(id) {
  const target = normalizeId(id);
  const result = await mutate(`/api/integrantes/${target}/restore`);
  invalidate(target, { clearList: false });
  return result;
}

export async function rehireIntegrante(id, input, type) {
  const target = normalizeId(id);
  const result = await mutate(`/api/integrantes/${target}/rehire`, { body: { ...input, tipo_integrante: type } });
  invalidate(target);
  return result;
}

export async function confirmIntegranteAccessesRemoved(id) {
  const target = normalizeId(id);
  const result = await mutate(`/api/integrantes/${target}/confirm-access-removal`);
  invalidate(target);
  return result;
}
