import { apiRequest, resetApiState } from "./api.js";
import { clearAttendanceCache } from "./asistencia/cache.js";
import { clearAgendaCache } from "./agenda/cache.js";
import { clearAreasCache } from "./areas/cache.js";
import { clearCargosCache } from "./cargos/cache.js";
import { clearCumpleanosCache } from "./cumpleanos/cache.js";
import { clearHorariosCache } from "./integrantes-horarios/cache.js";
import { clearInicioCache } from "./inicio/cache.js";
import { clearAccesosCache } from "./integrantes-accesos/cache.js";
import { clearIntegrantesCache } from "./integrantes/cache.js";
import { clearScheduleChangeRequestCache } from "./solicitudes-cambio-horario/cache.js";
import { clearAplicacionesCache } from "./aplicaciones/cache.js";
import { clearRolesCache } from "./roles/cache.js";
import { clearUsuariosCache } from "./usuarios/cache.js";
import { clearBitacoraCache } from "./bitacora/cache.js";
import { clearGestionProyectosCache } from "./gestion-proyectos/cache.js";
import { clearEquiposCache } from "./gestion-proyectos/equiposCache.js";
import { clearNotificacionesCache } from "./notificaciones/cache.js";

export async function loginRequest(email, password) {
  clearAgendaCache();
  clearAreasCache();
  clearAttendanceCache();
  clearCargosCache();
  clearCumpleanosCache();
  clearHorariosCache();
  clearInicioCache({ notify: false });
  clearIntegrantesCache();
  clearAccesosCache();
  clearScheduleChangeRequestCache();
  clearAplicacionesCache();
  clearRolesCache();
  clearUsuariosCache();
  clearBitacoraCache();
  clearGestionProyectosCache();
  clearEquiposCache();
  clearNotificacionesCache();
  return apiRequest("/api/login", {
    method: "POST",
    csrf: true,
    body: {
      email,
      password,
    },
  });
}

export async function getCurrentUser() {
  return apiRequest("/api/me");
}

export async function getPermissionsVersion() {
  return apiRequest("/api/me/permissions-version");
}

export async function updateProfile(nombres, apellidos) {
  return apiRequest("/api/profile", {
    method: "PATCH",
    csrf: true,
    body: { nombres, apellidos },
  });
}

export async function changeTemporaryPassword(password, passwordConfirmation) {
  return apiRequest("/api/profile/password", {
    method: "POST",
    csrf: true,
    body: {
      password,
      password_confirmation: passwordConfirmation,
    },
  });
}

export async function changePassword(
  currentPassword,
  newPassword,
  passwordConfirmation,
) {
  return apiRequest("/api/profile/password", {
    method: "PUT",
    csrf: true,
    body: {
      current_password: currentPassword,
      password: newPassword,
      password_confirmation: passwordConfirmation,
    },
  });
}

export async function logoutRequest() {
  try {
    return await apiRequest("/api/logout", {
      method: "POST",
      csrf: true,
    });
  } finally {
    clearAgendaCache();
    clearAreasCache();
    clearAttendanceCache();
    clearCargosCache();
    clearCumpleanosCache();
    clearHorariosCache();
    clearInicioCache({ notify: false });
    clearIntegrantesCache();
    clearAccesosCache();
    clearScheduleChangeRequestCache();
    clearAplicacionesCache();
    clearRolesCache();
    clearUsuariosCache();
    clearBitacoraCache();
    clearGestionProyectosCache();
    clearEquiposCache();
    clearNotificacionesCache();
    resetApiState();
  }
}
