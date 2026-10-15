export const MODULES = {
  MI_PERIODO: "mi_periodo",
  SOLICITUDES_HORARIO: "solicitudes_horario",
  CUMPLEANOS: "cumpleanos",

  // Módulo unificado de integrantes
  INTEGRANTES: "integrantes",

  // Módulos históricos conservados
  VOLUNTARIOS: "voluntarios",
  PRACTICANTES: "practicantes",

  APLICACIONES: "aplicaciones",

  ACCESOS: "accesos",
  BITACORA: "bitacora",
  AREAS: "areas",
  CARGOS: "cargos",
  USUARIOS: "usuarios",
  ROLES: "roles",
  ASISTENCIA: "asistencia",
  GESTION_PROYECTOS: "gestion_proyectos",
};

export const PERMISSIONS = {
  // =========================================================
  // HORARIOS PERSONALES
  // =========================================================
  MI_PERIODO_VER: "mi_periodo.ver",

  // Horario administrativo
  SOLICITUDES_HORARIO_VER: "solicitudes_horario.ver",
  SOLICITUDES_HORARIO_DESCARGAR_EXCEL: "solicitudes_horario.descargar_excel",

  CUMPLEANOS_VER: "cumpleanos.ver",
  CUMPLEANOS_DESCARGAR_EXCEL: "cumpleanos.descargar_excel",
  CUMPLEANOS_VER_METRICAS: "cumpleanos.ver_metricas",
  CUMPLEANOS_IMPRIMIR_HORARIO: "cumpleanos.imprimir_horario",

  // =========================================================
  // INTEGRANTES
  // =========================================================
  // Nuevo permiso unificado para el módulo Integrantes.
  INTEGRANTES_VER: "integrantes.ver",
  INTEGRANTES_CREAR: "integrantes.crear",
  INTEGRANTES_VER_DETALLE: "integrantes.ver_detalle",
  INTEGRANTES_EDITAR: "integrantes.editar",
  INTEGRANTES_DESACTIVAR: "integrantes.desactivar",
  INTEGRANTES_DESCARGAR_EXCEL: "integrantes.descargar_excel",
  INTEGRANTES_VER_METRICAS: "integrantes.ver_metricas",
  INTEGRANTES_VER_HISTORIAL: "integrantes.ver_historial",
  INTEGRANTES_RECONTRATAR: "integrantes.recontratar",
  INTEGRANTES_ACTIVAR: "integrantes.activar",

  // =========================================================
  // VOLUNTARIOS
  // =========================================================
  // Se mantienen por compatibilidad con datos/permisos
  // existentes en BD y rutas legacy.
  VOLUNTARIOS_VER: "voluntarios.ver",
  VOLUNTARIOS_CREAR: "voluntarios.crear",
  VOLUNTARIOS_EDITAR: "voluntarios.editar",
  VOLUNTARIOS_DESACTIVAR: "voluntarios.desactivar",
  VOLUNTARIOS_RECONTRATAR: "voluntarios.recontratar",
  VOLUNTARIOS_GESTIONAR_HORARIO: "voluntarios.gestionar_horario",
  VOLUNTARIOS_VER_HORARIO: "voluntarios.ver_horario",

  // =========================================================
  // PRACTICANTES
  // =========================================================
  PRACTICANTES_VER: "practicantes.ver",
  PRACTICANTES_CREAR: "practicantes.crear",
  PRACTICANTES_EDITAR: "practicantes.editar",
  PRACTICANTES_DESACTIVAR: "practicantes.desactivar",

  // =========================================================
  // APLICACIONES
  // =========================================================
  APLICACIONES_VER: "aplicaciones.ver",
  APLICACIONES_CREAR: "aplicaciones.crear",
  APLICACIONES_EDITAR: "aplicaciones.editar",
  APLICACIONES_DESACTIVAR: "aplicaciones.desactivar",
  APLICACIONES_DESCARGAR_EXCEL: "aplicaciones.descargar_excel",

  // =========================================================
  // ACCESOS
  // =========================================================
  ACCESOS_VER: "accesos.ver",
  ACCESOS_GESTIONAR: "accesos.gestionar",
  ACCESOS_VER_METRICAS: "accesos.ver_metricas",
  ACCESOS_DESCARGAR_EXCEL: "accesos.descargar_excel",
  ACCESOS_VER_INACTIVOS: "accesos.ver_inactivos",

  BITACORA_VER: "bitacora.ver",
  BITACORA_DESCARGAR_EXCEL: "bitacora.descargar_excel",
  BITACORA_VER_METRICAS: "bitacora.ver_metricas",

  // =========================================================
  // ÁREAS
  // =========================================================
  AREAS_VER: "areas.ver",
  AREAS_CREAR: "areas.crear",
  AREAS_EDITAR: "areas.editar",
  AREAS_DESACTIVAR: "areas.desactivar",
  AREAS_DESCARGAR_EXCEL: "areas.descargar_excel",

  // =========================================================
  // CARGOS
  // =========================================================
  CARGOS_VER: "cargos.ver",
  CARGOS_CREAR: "cargos.crear",
  CARGOS_EDITAR: "cargos.editar",
  CARGOS_DESACTIVAR: "cargos.desactivar",
  CARGOS_DESCARGAR_EXCEL: "cargos.descargar_excel",

  // =========================================================
  // USUARIOS
  // =========================================================
  USUARIOS_VER: "usuarios.ver",
  USUARIOS_RESTABLECER_CONTRASENA: "usuarios.restablecer_contrasena",
  USUARIOS_EDITAR_CORREO: "usuarios.editar_correo",
  USUARIOS_CONFIGURAR_ACCESO: "usuarios.configurar_acceso",
  USUARIOS_DESCARGAR_EXCEL: "usuarios.descargar_excel",

  // =========================================================
  // ROLES
  // =========================================================
  ROLES_VER: "roles.ver",
  ROLES_CREAR: "roles.crear",
  ROLES_EDITAR: "roles.editar",
  ROLES_DESACTIVAR: "roles.desactivar",
  ROLES_GESTIONAR_PERMISOS: "roles.gestionar_permisos",
  ROLES_GESTIONAR_CARGOS: "roles.gestionar_cargos",

  // =========================================================
  // ASISTENCIA
  // =========================================================
  ASISTENCIA_VER: "asistencia.ver",
  ASISTENCIA_GESTIONAR_CONFIGURACION: "asistencia.gestionar_configuracion",
  ASISTENCIA_GESTIONAR_SOLICITUDES: "asistencia.gestionar_solicitudes",
  ASISTENCIA_VER_HISTORIAL_SOLICITUDES: "asistencia.ver_historial_solicitudes",
  ASISTENCIA_GESTIONAR_AMONESTACIONES: "asistencia.gestionar_amonestaciones",
  ASISTENCIA_VER_METRICAS: "asistencia.ver_metricas",
  ASISTENCIA_DESCARGAR_EXCEL: "asistencia.descargar_excel",

  // Gestión de Proyectos · Detecta
  GP_EQUIPOS_VER: "gp.equipos.ver",
  GP_EQUIPOS_CREAR: "gp.equipos.crear",
  GP_EQUIPOS_EDITAR: "gp.equipos.editar",
  GP_EQUIPOS_DESCARGAR_EXCEL: "gp.equipos.descargar_excel",
  GP_EQUIPOS_VER_METRICAS: "gp.equipos.ver_metricas",
  GP_CONVOCATORIAS_VER: "gp.convocatorias.ver",
  GP_CONVOCATORIAS_CREAR: "gp.convocatorias.crear",
  GP_CONVOCATORIAS_EDITAR: "gp.convocatorias.editar",
  GP_CONVOCATORIAS_EVALUAR: "gp.convocatorias.evaluar",
  GP_CONVOCATORIAS_REVISAR: "gp.convocatorias.revisar",
  GP_CONVOCATORIAS_APROBAR: "gp.convocatorias.aprobar",
  GP_CONVOCATORIAS_POSTULAR: "gp.convocatorias.postular",
  GP_CONVOCATORIAS_ARCHIVAR: "gp.convocatorias.archivar",
  GP_CONVOCATORIAS_VER_APROBACION: "gp.convocatorias.ver_aprobacion",
  GP_CONVOCATORIAS_VER_POSTULACION: "gp.convocatorias.ver_postulacion",
  GP_CONVOCATORIAS_VER_ENVIO: "gp.convocatorias.ver_envio",
  GP_CONVOCATORIAS_VER_SEGUIMIENTO: "gp.convocatorias.ver_seguimiento",
  GP_CONVOCATORIAS_VER_CIERRE: "gp.convocatorias.ver_cierre",
  GP_CONVOCATORIAS_DESCARGAR_EXCEL: "gp.convocatorias.descargar_excel",
  GP_CAPACITACIONES_VER: "gp.capacitaciones.ver",
  GP_CAPACITACIONES_GESTIONAR: "gp.capacitaciones.gestionar",
};

export const GLOBAL_ONLY_PERMISSIONS = new Set([
  PERMISSIONS.AREAS_CREAR,
  PERMISSIONS.ASISTENCIA_GESTIONAR_CONFIGURACION,
  PERMISSIONS.ROLES_CREAR,
  PERMISSIONS.ROLES_EDITAR,
  PERMISSIONS.ROLES_DESACTIVAR,
  PERMISSIONS.ROLES_GESTIONAR_PERMISOS,
  PERMISSIONS.ROLES_GESTIONAR_CARGOS,
]);

export function isGlobalOnlyPermission(permissionCode) {
  return GLOBAL_ONLY_PERMISSIONS.has(normalizePermissionCode(permissionCode));
}

export const MODULE_PERMISSIONS = {
  // =========================================================
  // MI PERIODO
  // =========================================================
  [MODULES.MI_PERIODO]: [PERMISSIONS.MI_PERIODO_VER],

  [MODULES.SOLICITUDES_HORARIO]: [
    PERMISSIONS.SOLICITUDES_HORARIO_VER,
    PERMISSIONS.SOLICITUDES_HORARIO_DESCARGAR_EXCEL,
  ],

  // =========================================================
  // CUMPLEAÑOS
  // =========================================================
  [MODULES.CUMPLEANOS]: [
    PERMISSIONS.CUMPLEANOS_VER,
    PERMISSIONS.CUMPLEANOS_DESCARGAR_EXCEL,
    PERMISSIONS.CUMPLEANOS_VER_METRICAS,
    PERMISSIONS.CUMPLEANOS_IMPRIMIR_HORARIO,
  ],

  // =========================================================
  // INTEGRANTES
  // =========================================================
  [MODULES.INTEGRANTES]: [
    PERMISSIONS.INTEGRANTES_VER,
    PERMISSIONS.INTEGRANTES_CREAR,
    PERMISSIONS.INTEGRANTES_VER_DETALLE,
    PERMISSIONS.INTEGRANTES_EDITAR,
    PERMISSIONS.INTEGRANTES_DESACTIVAR,
    PERMISSIONS.INTEGRANTES_DESCARGAR_EXCEL,
    PERMISSIONS.INTEGRANTES_VER_METRICAS,
    PERMISSIONS.INTEGRANTES_VER_HISTORIAL,
    PERMISSIONS.INTEGRANTES_RECONTRATAR,
    PERMISSIONS.INTEGRANTES_ACTIVAR,
  ],

  // =========================================================
  // APLICACIONES
  // =========================================================
  [MODULES.APLICACIONES]: [
    PERMISSIONS.APLICACIONES_VER,
    PERMISSIONS.APLICACIONES_CREAR,
    PERMISSIONS.APLICACIONES_EDITAR,
    PERMISSIONS.APLICACIONES_DESACTIVAR,
    PERMISSIONS.APLICACIONES_DESCARGAR_EXCEL,
  ],

  // =========================================================
  // ACCESOS
  // =========================================================
  [MODULES.ACCESOS]: [
    PERMISSIONS.ACCESOS_VER,
    PERMISSIONS.ACCESOS_GESTIONAR,
    PERMISSIONS.ACCESOS_VER_METRICAS,
    PERMISSIONS.ACCESOS_DESCARGAR_EXCEL,
    PERMISSIONS.ACCESOS_VER_INACTIVOS,
  ],

  [MODULES.BITACORA]: [
    PERMISSIONS.BITACORA_VER,
    PERMISSIONS.BITACORA_DESCARGAR_EXCEL,
    PERMISSIONS.BITACORA_VER_METRICAS,
  ],

  // =========================================================
  // ÁREAS
  // =========================================================
  [MODULES.AREAS]: [
    PERMISSIONS.AREAS_VER,
    PERMISSIONS.AREAS_CREAR,
    PERMISSIONS.AREAS_EDITAR,
    PERMISSIONS.AREAS_DESACTIVAR,
    PERMISSIONS.AREAS_DESCARGAR_EXCEL,
  ],

  // =========================================================
  // CARGOS
  // =========================================================
  [MODULES.CARGOS]: [
    PERMISSIONS.CARGOS_VER,
    PERMISSIONS.CARGOS_CREAR,
    PERMISSIONS.CARGOS_EDITAR,
    PERMISSIONS.CARGOS_DESACTIVAR,
    PERMISSIONS.CARGOS_DESCARGAR_EXCEL,
  ],

  // =========================================================
  // USUARIOS
  // =========================================================
  [MODULES.USUARIOS]: [
    PERMISSIONS.USUARIOS_VER,
    PERMISSIONS.USUARIOS_RESTABLECER_CONTRASENA,
    PERMISSIONS.USUARIOS_EDITAR_CORREO,
    PERMISSIONS.USUARIOS_CONFIGURAR_ACCESO,
    PERMISSIONS.USUARIOS_DESCARGAR_EXCEL,
  ],

  // =========================================================
  // ROLES
  // =========================================================
  [MODULES.ROLES]: [
    PERMISSIONS.ROLES_VER,
    PERMISSIONS.ROLES_CREAR,
    PERMISSIONS.ROLES_EDITAR,
    PERMISSIONS.ROLES_DESACTIVAR,
    PERMISSIONS.ROLES_GESTIONAR_PERMISOS,
    PERMISSIONS.ROLES_GESTIONAR_CARGOS,
  ],

  // =========================================================
  // ASISTENCIA
  // =========================================================
  [MODULES.ASISTENCIA]: [
    PERMISSIONS.ASISTENCIA_VER,
    PERMISSIONS.ASISTENCIA_GESTIONAR_CONFIGURACION,
    PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES,
    PERMISSIONS.ASISTENCIA_VER_HISTORIAL_SOLICITUDES,
    PERMISSIONS.ASISTENCIA_GESTIONAR_AMONESTACIONES,
    PERMISSIONS.ASISTENCIA_VER_METRICAS,
    PERMISSIONS.ASISTENCIA_DESCARGAR_EXCEL,
  ],

  [MODULES.GESTION_PROYECTOS]: [
    PERMISSIONS.GP_EQUIPOS_VER,
    PERMISSIONS.GP_EQUIPOS_CREAR,
    PERMISSIONS.GP_EQUIPOS_EDITAR,
    PERMISSIONS.GP_EQUIPOS_DESCARGAR_EXCEL,
    PERMISSIONS.GP_EQUIPOS_VER_METRICAS,
    PERMISSIONS.GP_CONVOCATORIAS_VER,
    PERMISSIONS.GP_CONVOCATORIAS_CREAR,
    PERMISSIONS.GP_CONVOCATORIAS_EDITAR,
    PERMISSIONS.GP_CONVOCATORIAS_EVALUAR,
    PERMISSIONS.GP_CONVOCATORIAS_REVISAR,
    PERMISSIONS.GP_CONVOCATORIAS_APROBAR,
    PERMISSIONS.GP_CONVOCATORIAS_POSTULAR,
    PERMISSIONS.GP_CONVOCATORIAS_ARCHIVAR,
    PERMISSIONS.GP_CONVOCATORIAS_VER_APROBACION,
    PERMISSIONS.GP_CONVOCATORIAS_VER_POSTULACION,
    PERMISSIONS.GP_CONVOCATORIAS_VER_ENVIO,
    PERMISSIONS.GP_CONVOCATORIAS_VER_SEGUIMIENTO,
    PERMISSIONS.GP_CONVOCATORIAS_VER_CIERRE,
    PERMISSIONS.GP_CONVOCATORIAS_DESCARGAR_EXCEL,
    PERMISSIONS.GP_CAPACITACIONES_VER,
    PERMISSIONS.GP_CAPACITACIONES_GESTIONAR,
  ],
};

function getRoleObject(profile) {
  return profile?.role || profile?.role_info || null;
}

function normalizePermissionCode(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePermissionList(profile) {
  return Array.isArray(profile?.permissions) ? profile.permissions : [];
}

function normalizeScope(value) {
  return value === "global" ? "global" : "area";
}

export function getRole(profile) {
  return getRoleObject(profile);
}

export function getRoleCode(profile) {
  return getRole(profile)?.codigo || profile?.rol || null;
}

export function getRoleId(profile) {
  const role = getRole(profile);
  const roleId = Number(role?.id || profile?.role_id || null);

  return Number.isFinite(roleId) && roleId > 0 ? roleId : null;
}

export function getCargoId(profile) {
  const cargoId = Number(profile?.cargo_id || profile?.cargo?.id || null);

  return Number.isFinite(cargoId) && cargoId > 0 ? cargoId : null;
}

export function getAreaId(profile) {
  const areaId = Number(
    profile?.area?.id ||
      profile?.area_id ||
      profile?.cargo?.area_id ||
      profile?.cargo?.areas?.id ||
      null,
  );

  return Number.isFinite(areaId) && areaId > 0 ? areaId : null;
}

export function hasAccessTotal(profile) {
  return getRole(profile)?.acceso_total === true;
}

export function getLandingPath() {
  return "/inicio";
}

export function getPermission(profile, permissionCode) {
  const code = normalizePermissionCode(permissionCode);

  if (!profile || !code) return null;

  return (
    normalizePermissionList(profile).find((permission) => {
      if (typeof permission === "string") {
        return permission === code;
      }

      const nestedCode = permission?.permiso?.codigo || permission?.permission?.codigo;

      return (permission?.codigo === code || nestedCode === code) && permission?.activo !== false;
    }) || null
  );
}

export function getPermissionScope(profile, permissionCode) {
  if (hasAccessTotal(profile)) {
    return "global";
  }

  const permission = getPermission(profile, permissionCode);

  if (!permission) return null;

  if (typeof permission === "string") {
    return "area";
  }

  return normalizeScope(permission?.alcance || permission?.scope);
}

export function hasPermission(profile, permissionCode) {
  if (!profile || !normalizePermissionCode(permissionCode)) {
    return false;
  }

  if (hasAccessTotal(profile)) {
    return true;
  }

  return Boolean(getPermission(profile, permissionCode));
}

export function hasAnyPermission(profile, permissionCodes = []) {
  if (hasAccessTotal(profile)) {
    return true;
  }

  return (permissionCodes || []).some((permissionCode) => hasPermission(profile, permissionCode));
}

export function hasAllPermissions(profile, permissionCodes = []) {
  if (hasAccessTotal(profile)) {
    return true;
  }

  return (permissionCodes || []).every((permissionCode) => hasPermission(profile, permissionCode));
}

export function hasModulePermission(profile, module) {
  if (hasAccessTotal(profile)) {
    return true;
  }

  const moduleCode = normalizePermissionCode(module);

  if (!moduleCode) return false;

  return normalizePermissionList(profile).some((permission) => {
    if (typeof permission === "string") {
      return permission === moduleCode;
    }

    return permission?.modulo === moduleCode && permission?.activo !== false;
  });
}

export function canAccessArea(profile, permissionCode, areaId) {
  if (!profile || !hasPermission(profile, permissionCode)) {
    return false;
  }

  if (hasAccessTotal(profile)) {
    return true;
  }

  const scope = getPermissionScope(profile, permissionCode);

  if (scope === "global") {
    return true;
  }

  const profileAreaId = getAreaId(profile);
  const targetAreaId = Number(areaId);

  return (
    Boolean(profileAreaId) &&
    Number.isFinite(targetAreaId) &&
    targetAreaId > 0 &&
    profileAreaId === targetAreaId
  );
}

export function getPermissionAreaId(profile, permissionCode) {
  if (!hasPermission(profile, permissionCode)) {
    return null;
  }

  if (hasAccessTotal(profile) || getPermissionScope(profile, permissionCode) === "global") {
    return null;
  }

  return getAreaId(profile);
}

export function getPermissionScopeKey(profile, permissionCodes = []) {
  if (!profile) return "anon";

  if (hasAccessTotal(profile)) {
    return "global";
  }

  const codes = Array.isArray(permissionCodes) ? permissionCodes : [permissionCodes];

  const scoped = codes.find((code) => hasPermission(profile, code));

  if (!scoped) {
    return `user:${profile.id || "anon"}`;
  }

  const scope = getPermissionScope(profile, scoped);

  if (scope === "global") {
    return "global";
  }

  const areaId = getAreaId(profile);

  return areaId ? `area:${areaId}` : "area:sin-area";
}

export function canViewAreas(profile) {
  return hasAnyPermission(profile, [PERMISSIONS.AREAS_VER]);
}

export function canManageAreas(profile) {
  return hasAnyPermission(profile, [
    PERMISSIONS.AREAS_CREAR,
    PERMISSIONS.AREAS_EDITAR,
    PERMISSIONS.AREAS_DESACTIVAR,
  ]);
}

export function canManageCargos(profile) {
  return hasAnyPermission(profile, [
    PERMISSIONS.CARGOS_CREAR,
    PERMISSIONS.CARGOS_EDITAR,
    PERMISSIONS.CARGOS_DESACTIVAR,
  ]);
}
