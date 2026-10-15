import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { clearNotificacionesCache } from "./cache";
import { marcarNotificacionLeida } from "./mutations";
import { listarNotificaciones } from "./queries";

vi.mock("@/services/api", () => ({
  apiRequest: vi.fn(),
}));

describe("servicio de notificaciones con caché", () => {
  beforeEach(() => {
    clearNotificacionesCache();
    vi.clearAllMocks();
  });

  it("reutiliza el listado e invalida después de una mutación", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [{ id: 1, read_at: null }] })
      .mockResolvedValueOnce({ data: { id: 1 } })
      .mockResolvedValueOnce({ data: [{ id: 1, read_at: "2026-10-12T12:00:00Z" }] });

    await listarNotificaciones({ cacheScope: "account-1" });
    await listarNotificaciones({ cacheScope: "account-1" });
    expect(apiRequest).toHaveBeenCalledTimes(1);

    await marcarNotificacionLeida(1);
    await expect(listarNotificaciones({ cacheScope: "account-1" })).resolves.toEqual([
      { id: 1, read_at: "2026-10-12T12:00:00Z" },
    ]);
    expect(apiRequest).toHaveBeenCalledTimes(3);
  });
});
