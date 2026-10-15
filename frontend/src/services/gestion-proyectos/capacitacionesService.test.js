import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/services/api";
import {
  completeCapacitacionStage,
  getCapacitaciones,
} from "./capacitacionesService";

vi.mock("@/services/api", () => ({ apiRequest: vi.fn() }));

describe("capacitacionesService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normaliza el listado y el permiso de gestión", async () => {
    apiRequest.mockResolvedValue({ data: [{ integrante_id: 4 }], meta: { can_manage: true } });

    await expect(getCapacitaciones()).resolves.toEqual({
      items: [{ integrante_id: 4 }],
      canManage: true,
    });
    expect(apiRequest).toHaveBeenCalledWith("/api/gestion-proyectos/capacitaciones");
  });

  it("completa una fase mediante una escritura con CSRF", async () => {
    apiRequest.mockResolvedValue({ data: { integrante_id: 4, etapa_actual: 2 } });

    await expect(completeCapacitacionStage(4, 1)).resolves.toMatchObject({ etapa_actual: 2 });
    expect(apiRequest).toHaveBeenCalledWith(
      "/api/gestion-proyectos/capacitaciones/4/etapas/1",
      { method: "PATCH", csrf: true },
    );
  });
});
