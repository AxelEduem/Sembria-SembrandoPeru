import {
  PERMISSIONS,
  canAccessArea,
  getPermissionAreaId,
  hasAnyPermission,
  hasAccessTotal,
} from "@/utils/permissions";

const ACCESS_PERMISSIONS = [
  PERMISSIONS.ACCESOS_GESTIONAR,
  PERMISSIONS.ACCESOS_VER,
  PERMISSIONS.ACCESOS_VER_METRICAS,
  PERMISSIONS.ACCESOS_VER_INACTIVOS,
];

export function scopeKey(profile) {
  if (!profile) return "anon";
  if (hasAccessTotal(profile)) return "global";
  const scopedPermission = ACCESS_PERMISSIONS.find(
    (permission) => getPermissionAreaId(profile, permission) !== null,
  );
  if (scopedPermission) return `area:${getPermissionAreaId(profile, scopedPermission)}`;
  if (ACCESS_PERMISSIONS.some((permission) => hasAnyPermission(profile, [permission])))
    return "global";
  return `user:${profile.id || "anon"}`;
}

function assertPermission(profile, permissions, action) {
  if (!hasAccessTotal(profile) && !hasAnyPermission(profile, permissions)) {
    throw new Error(`No tienes permisos para ${action} accesos.`);
  }
}

export const requireAccesosView = (profile) =>
  assertPermission(profile, [PERMISSIONS.ACCESOS_VER, PERMISSIONS.ACCESOS_GESTIONAR], "ver los");
export const requireAccesosInactive = (profile) =>
  assertPermission(
    profile,
    [PERMISSIONS.ACCESOS_VER_INACTIVOS, PERMISSIONS.ACCESOS_VER_METRICAS],
    "ver integrantes inactivos con",
  );
export const requireAccesosAssign = (profile) =>
  assertPermission(profile, [PERMISSIONS.ACCESOS_GESTIONAR], "asignar");
export const requireAccesosRevoke = (profile) =>
  assertPermission(profile, [PERMISSIONS.ACCESOS_GESTIONAR], "retirar");

export function assertIntegranteAreaAccess(profile, permissionCode, areaId) {
  if (!hasAccessTotal(profile) && !canAccessArea(profile, permissionCode, areaId)) {
    throw new Error("No tienes permisos para administrar integrantes fuera del alcance de tu rol.");
  }
}

export { PERMISSIONS, canAccessArea, hasAccessTotal };
