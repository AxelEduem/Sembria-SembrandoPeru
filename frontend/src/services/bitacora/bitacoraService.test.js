import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { clearBitacoraCache } from "./cache";
import { exportBitacora, getBitacora, getBitacoraMetrics } from "./bitacoraService";

const apiState = vi.hoisted(() => ({ mutationListener: null }));

vi.mock("@/services/api", () => ({
  apiRequest: vi.fn(),
  subscribeApiMutation: vi.fn((listener) => {
    apiState.mutationListener = listener;
    return () => {
      apiState.mutationListener = null;
    };
  }),
}));

describe("caché de bitácora", () => {
  beforeEach(() => {
    clearBitacoraCache();
    vi.clearAllMocks();
  });

  it("reutiliza el listado por filtros y alcance", async () => {
    apiRequest.mockResolvedValue({ data: [{ id: 1 }] });
    const filters = { page: 1, modulo: "usuarios" };

    const first = getBitacora(filters, { cacheScope: "cuenta:global" });
    const second = getBitacora(filters, { cacheScope: "cuenta:global" });

    await expect(first).resolves.toEqual({ data: [{ id: 1 }] });
    await expect(second).resolves.toEqual({ data: [{ id: 1 }] });
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  it("separa resultados por alcance y permite forzar la recarga", async () => {
    apiRequest.mockResolvedValue({ data: [] });
    const filters = { page: 1 };

    await getBitacora(filters, { cacheScope: "cuenta-1:area:2" });
    await getBitacora(filters, { cacheScope: "cuenta-2:area:3" });
    await getBitacora(filters, { cacheScope: "cuenta-1:area:2", force: true });

    expect(apiRequest).toHaveBeenCalledTimes(3);
  });

  it("cachea métricas pero mantiene la exportación siempre actual", async () => {
    apiRequest.mockResolvedValue({ data: [] });

    await getBitacoraMetrics({ cacheScope: "cuenta:global" });
    await getBitacoraMetrics({ cacheScope: "cuenta:global" });
    await exportBitacora({ modulo: "usuarios" });
    await exportBitacora({ modulo: "usuarios" });

    expect(apiRequest).toHaveBeenCalledTimes(3);
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/bitacora/exportar?modulo=usuarios");
    expect(apiRequest).toHaveBeenNthCalledWith(3, "/api/bitacora/exportar?modulo=usuarios");
  });

  it("invalida los datos al completarse una mutación en cualquier módulo", async () => {
    apiRequest.mockResolvedValue({ data: [] });

    await getBitacora({}, { cacheScope: "cuenta:global" });
    apiState.mutationListener();
    await getBitacora({}, { cacheScope: "cuenta:global" });

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});
