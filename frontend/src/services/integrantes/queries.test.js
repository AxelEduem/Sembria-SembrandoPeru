import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { clearIntegrantesCache } from "./cache";
import { exportIntegrantes, getIntegrantesPage } from "./queries";

vi.mock("@/services/api", () => ({
  apiRequest: vi.fn(),
}));

describe("consultas paginadas de integrantes", () => {
  beforeEach(() => {
    clearIntegrantesCache();
    vi.clearAllMocks();
  });

  it("envÃ­a filtros y paginaciÃ³n al backend", async () => {
    apiRequest.mockResolvedValue({
      data: [{ id: 10 }],
      meta: {
        current_page: 2,
        last_page: 4,
        per_page: 5,
        total: 18,
        from: 6,
        to: 10,
      },
    });

    await expect(getIntegrantesPage({
      search: "Ana Torres",
      areaFilter: "3",
      cargoFilter: "7",
      typeFilter: "practicante",
      periodFilter: "6",
      statusFilter: "activo",
      dateFilter: "2026-10-12",
      page: 2,
      perPage: 5,
    })).resolves.toEqual({
      data: [{ id: 10 }],
      pagination: {
        currentPage: 2,
        lastPage: 4,
        perPage: 5,
        total: 18,
        from: 6,
        to: 10,
      },
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/integrantes?q=Ana+Torres&area=3&cargo=7&tipo=practicante&periodo=6&estado=activo&fecha=2026-10-12&pagina=2&por_pagina=5",
    );
  });

  it("exporta todos los resultados filtrados sin parÃ¡metros de paginaciÃ³n", async () => {
    apiRequest.mockResolvedValue({ data: [{ id: 20 }, { id: 21 }] });

    await expect(exportIntegrantes({
      search: "ana",
      statusFilter: "inactivo",
    })).resolves.toEqual([{ id: 20 }, { id: 21 }]);

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/integrantes/exportar?q=ana&estado=inactivo",
    );
  });
});
