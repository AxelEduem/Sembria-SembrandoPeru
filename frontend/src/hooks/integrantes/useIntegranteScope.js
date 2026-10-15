import { useMemo } from "react";
import { useIntegranteCatalogs } from "./useIntegranteCatalogs";
import {
  PERMISSIONS,
  getAreaId,
  getPermissionScope,
  hasAccessTotal,
  hasPermission,
} from "@/utils/permissions";
import { normalizeId } from "@/utils/formHelpers";

export function useIntegranteScope(profile, { mode, selectedType }) {
  const { areas, cargos } = useIntegranteCatalogs();

  const permissionCodes = useMemo(() => {
    const isPracticante = selectedType === "practicante";

    const create = isPracticante ? PERMISSIONS.PRACTICANTES_CREAR : PERMISSIONS.VOLUNTARIOS_CREAR;

    const edit = isPracticante ? PERMISSIONS.PRACTICANTES_EDITAR : PERMISSIONS.VOLUNTARIOS_EDITAR;

    return {
      create,
      edit,
      active: mode === "edit" ? PERMISSIONS.INTEGRANTES_EDITAR : PERMISSIONS.INTEGRANTES_CREAR,
      legacyActive: mode === "edit" ? edit : create,
      any: [PERMISSIONS.INTEGRANTES_CREAR, PERMISSIONS.INTEGRANTES_EDITAR, create, edit],
    };
  }, [mode, selectedType]);

  const accessTotal = hasAccessTotal(profile);

  const canCreateVoluntario =
    accessTotal ||
    hasPermission(profile, PERMISSIONS.INTEGRANTES_CREAR) ||
    hasPermission(profile, PERMISSIONS.VOLUNTARIOS_CREAR);
  const canCreatePracticante =
    accessTotal ||
    hasPermission(profile, PERMISSIONS.INTEGRANTES_CREAR) ||
    hasPermission(profile, PERMISSIONS.PRACTICANTES_CREAR);

  // Si aún no se eligió tipo (creación), permite avanzar si el usuario tiene
  // al menos un permiso de creación. La validación del tipo se hace en submit.
  const canManageCurrentType = selectedType
    ? accessTotal ||
      hasPermission(profile, permissionCodes.active) ||
      hasPermission(profile, permissionCodes.legacyActive)
    : accessTotal || canCreateVoluntario || canCreatePracticante;

  const isAreaScoped = useMemo(() => {
    if (accessTotal) return false;

    return permissionCodes.any.some((code) => getPermissionScope(profile, code) === "area");
  }, [accessTotal, permissionCodes, profile]);

  const userAreaId = normalizeId(getAreaId(profile));

  const allowedAreas = useMemo(() => {
    const active = (areas || []).filter((area) => area?.activo !== false);

    if (!isAreaScoped) return active;
    if (!userAreaId) return [];

    return active.filter((area) => normalizeId(area.id) === userAreaId);
  }, [areas, isAreaScoped, userAreaId]);

  const getAvailableCargos = useMemo(
    () => (areaId) => {
      if (!areaId) return [];

      return (cargos || [])
        .filter((cargo) => cargo?.activo !== false)
        .filter((cargo) => String(cargo.area_id) === String(areaId));
    },
    [cargos],
  );

  return {
    areas,
    cargos,
    allowedAreas,
    getAvailableCargos,
    canCreateVoluntario,
    canCreatePracticante,
    canManageCurrentType,
    isAreaScoped,
    userAreaId,
    permissionCodes,
  };
}
