import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearNotificacionesCache,
  getCachedNotificaciones,
  getNotificacionesCache,
  invalidateNotificacionesCache,
  NOTIFICACIONES_CACHE_GROUPS,
} from "./cache";

describe("caché de notificaciones", () => {
  beforeEach(() => {
    clearNotificacionesCache();
  });

  it("deduplica solicitudes simultáneas y separa los datos por cuenta", async () => {
    const loader = vi.fn().mockResolvedValue([{ id: 1 }]);

    const first = getCachedNotificaciones("account-1", loader);
    const second = getCachedNotificaciones("account-1", loader);

    await expect(Promise.all([first, second])).resolves.toEqual([[{ id: 1 }], [{ id: 1 }]]);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(getNotificacionesCache("account-1")).toEqual([{ id: 1 }]);
    expect(getNotificacionesCache("account-2")).toBeNull();
  });

  it("invalida el listado después de una mutación", async () => {
    await getCachedNotificaciones("account-1", async () => [{ id: 1 }]);

    invalidateNotificacionesCache(NOTIFICACIONES_CACHE_GROUPS.LIST);

    expect(getNotificacionesCache("account-1")).toBeNull();
  });
});
