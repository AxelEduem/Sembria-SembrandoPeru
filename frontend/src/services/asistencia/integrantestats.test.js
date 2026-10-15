import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { clearAttendanceCache } from "./cache";
import { getIntegranteAsistenciaTotal } from "./integrantestats";
import { cerrarAsistenciaAdministrativamente } from "./mutations";

vi.mock("@/services/api", () => ({
  apiRequest: vi.fn(),
}));

describe("caché del total de horas de asistencia", () => {
  beforeEach(() => {
    clearAttendanceCache();
    vi.clearAllMocks();
  });

  it("deduplica la consulta y separa el resultado por cuenta", async () => {
    apiRequest.mockResolvedValue({ data: { hours: 12.5 } });

    const first = getIntegranteAsistenciaTotal(10, { cacheScope: "account-1" });
    const second = getIntegranteAsistenciaTotal(10, { cacheScope: "account-1" });

    await expect(Promise.all([first, second])).resolves.toEqual([12.5, 12.5]);
    expect(apiRequest).toHaveBeenCalledTimes(1);

    await getIntegranteAsistenciaTotal(10, { cacheScope: "account-2" });
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("vuelve a consultar después de una mutación de asistencia", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: { hours: 8 } })
      .mockResolvedValueOnce({ data: { id: 20 } })
      .mockResolvedValueOnce({ data: { hours: 9 } });

    await expect(getIntegranteAsistenciaTotal(10)).resolves.toBe(8);
    await cerrarAsistenciaAdministrativamente(20, { motivo: "Corrección" });
    await expect(getIntegranteAsistenciaTotal(10)).resolves.toBe(9);
    expect(apiRequest).toHaveBeenCalledTimes(3);
  });
});
