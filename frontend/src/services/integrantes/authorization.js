import { canAccessArea } from "@/utils/permissions";

export function assertIntegranteAreaAccess(profile, permissionCode, areaId) {
  if (!canAccessArea(profile, permissionCode, areaId)) {
    throw new Error("Solo puedes administrar integrantes dentro del alcance permitido por tu rol.");
  }
}
