import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, resetApiState } from "./api";
import { getConvocatoriasCache, loadGestionProyectosCached } from "./gestion-proyectos/cache";
import {
  getEquiposCache,
  loadEquiposCached,
} from "./gestion-proyectos/equiposCache";
import { getCachedNotificaciones, getNotificacionesCache } from "./notificaciones/cache";
import {
  getPermissionsVersion,
  loginRequest,
  logoutRequest,
} from "./authService";

vi.mock("./api", () => ({
  apiRequest: vi.fn(),
  resetApiState: vi.fn(),
  subscribeApiMutation: vi.fn(() => () => undefined),
}));

describe("limpieza de cachés al cambiar de sesión", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({});
  });

  it.each([
    ["iniciar sesión", () => loginRequest("user@example.com", "secret")],
    ["cerrar sesión", () => logoutRequest()],
  ])("limpia gestión de proyectos y notificaciones al %s", async (_label, changeSession) => {
    await loadGestionProyectosCached("convocatorias:account-1", async () => [{ id: 1 }]);
    await loadEquiposCached(async () => [{ id: 2 }], { cacheScope: "account-1" });
    await getCachedNotificaciones("account-1", async () => [{ id: 3 }]);

    expect(getConvocatoriasCache("account-1")).toEqual([{ id: 1 }]);
    expect(getEquiposCache("account-1")).toEqual([{ id: 2 }]);
    expect(getNotificacionesCache("account-1")).toEqual([{ id: 3 }]);

    await changeSession();

    expect(getConvocatoriasCache("account-1")).toBeNull();
    expect(getEquiposCache("account-1")).toBeNull();
    expect(getNotificacionesCache("account-1")).toBeNull();
  });

  it("reinicia el estado CSRF al cerrar sesión", async () => {
    await logoutRequest();
    expect(resetApiState).toHaveBeenCalledOnce();
  });

  it("consulta la versión de permisos sin mutar la sesión", async () => {
    await getPermissionsVersion();

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/me/permissions-version"
    );
    expect(resetApiState).not.toHaveBeenCalled();
  });
});
