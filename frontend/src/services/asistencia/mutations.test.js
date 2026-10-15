import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { iniciarAsistenciaConMotivo } from "./mutations";

vi.mock("@/services/api", () => ({
  apiRequest: vi.fn(),
}));

const OCCURRED_AT = "2026-10-12T14:17:00.000Z";

function setOnline(value) {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("mutaciones de asistencia tardía", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setOnline(true);
  });

  afterEach(() => {
    setOnline(true);
  });

  it("envía la hora en que se abrió el modal", async () => {
    apiRequest.mockResolvedValue({ data: { id: 10 } });

    await iniciarAsistenciaConMotivo(3, "Demora en el transporte.", [], OCCURRED_AT);

    expect(apiRequest).toHaveBeenCalledWith("/api/mi-asistencia/iniciar", expect.objectContaining({
      method: "POST",
      body: expect.objectContaining({ ocurrido_en: OCCURRED_AT }),
    }));
  });

  it("conserva esa hora si el registro queda en la cola sin conexión", async () => {
    setOnline(false);

    await iniciarAsistenciaConMotivo(3, "Demora en el transporte.", [], OCCURRED_AT);

    const queue = JSON.parse(localStorage.getItem("sembria_attendance_offline_queue"));
    expect(queue).toHaveLength(1);
    expect(queue[0].body.ocurrido_en).toBe(OCCURRED_AT);
    expect(queue[0].body.client_event_id).toBeTruthy();
    expect(apiRequest).not.toHaveBeenCalled();
  });
});
