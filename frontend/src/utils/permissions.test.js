import { describe, expect, it } from "vitest";

import {
  canAccessArea,
  getPermissionScope,
  getPermissionScopeKey,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isGlobalOnlyPermission,
} from "./permissions";

const areaProfile = {
  id: 9,
  area_id: 12,
  role: { id: 2, activo: true, acceso_total: false },
  permissions: [
    { codigo: "integrantes.ver", alcance: "area", activo: true },
    { codigo: "integrantes.editar", alcance: "global", activo: true },
    { codigo: "integrantes.desactivar", alcance: "area", activo: false },
  ],
};

describe("permissions", () => {
  it("reconoce permisos activos e ignora permisos desactivados", () => {
    expect(hasPermission(areaProfile, "integrantes.ver")).toBe(true);
    expect(hasPermission(areaProfile, "integrantes.desactivar")).toBe(false);
    expect(hasPermission(areaProfile, "integrantes.crear")).toBe(false);
  });

  it("respeta los alcances global y por area", () => {
    expect(getPermissionScope(areaProfile, "integrantes.ver")).toBe("area");
    expect(canAccessArea(areaProfile, "integrantes.ver", 12)).toBe(true);
    expect(canAccessArea(areaProfile, "integrantes.ver", 13)).toBe(false);
    expect(canAccessArea(areaProfile, "integrantes.editar", 13)).toBe(true);
  });

  it("concede todos los permisos solo a un rol con acceso total", () => {
    const fullAccessProfile = {
      ...areaProfile,
      role: { activo: true, acceso_total: true },
      permissions: [],
    };

    expect(hasPermission(fullAccessProfile, "cualquier.permiso")).toBe(true);
    expect(getPermissionScope(fullAccessProfile, "cualquier.permiso")).toBe("global");
    expect(getPermissionScopeKey(fullAccessProfile, ["cualquier.permiso"])).toBe("global");
  });

  it("evalua correctamente conjuntos any y all", () => {
    expect(hasAnyPermission(areaProfile, ["integrantes.crear", "integrantes.ver"])).toBe(true);
    expect(hasAllPermissions(areaProfile, ["integrantes.ver", "integrantes.editar"])).toBe(true);
    expect(hasAllPermissions(areaProfile, ["integrantes.ver", "integrantes.crear"])).toBe(false);
  });

  it("produce una clave de cache aislada por area", () => {
    expect(getPermissionScopeKey(areaProfile, ["integrantes.ver"])).toBe("area:12");
  });

  it("identifica permisos que solo pueden tener alcance global", () => {
    expect(isGlobalOnlyPermission("roles.gestionar_permisos")).toBe(true);
    expect(isGlobalOnlyPermission("asistencia.gestionar_configuracion")).toBe(true);
    expect(isGlobalOnlyPermission("integrantes.editar")).toBe(false);
  });
});
