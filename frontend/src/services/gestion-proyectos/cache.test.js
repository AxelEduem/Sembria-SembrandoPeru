import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { clearGestionProyectosCache } from "./cache";
import { getConvocatorias } from "./convocatoriasService";

vi.mock("@/services/api", () => ({ apiRequest: vi.fn() }));

describe("caché de convocatorias", () => {
  beforeEach(() => {
    clearGestionProyectosCache();
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplica solicitudes simultáneas y separa la caché por cuenta", async () => {
    await Promise.all([
      getConvocatorias({ cacheScope: "cuenta-1" }),
      getConvocatorias({ cacheScope: "cuenta-1" }),
    ]);
    await getConvocatorias({ cacheScope: "cuenta-2" });

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("vuelve a consultar los listados cuando vence el TTL", async () => {
    let now = 1_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    await getConvocatorias({ cacheScope: "cuenta-1" });
    now += 60_001;
    await getConvocatorias({ cacheScope: "cuenta-1" });

    expect(apiRequest).toHaveBeenCalledTimes(2);
  });
});
