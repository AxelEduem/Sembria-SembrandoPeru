import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "@/services/api";
import { createTarea, getTareaIntegrantes, getTareas } from "@/services/tareas/tareasService";
import { clearAgendaCache } from "./cache";
import { getAgendaMeetings } from "./agendaService";
import { createNotaPersonal, getNotasPersonales } from "./notasService";

vi.mock("@/services/api", () => ({ apiRequest: vi.fn() }));

describe("caché del módulo de agenda", () => {
  beforeEach(() => {
    clearAgendaCache();
    vi.clearAllMocks();
    apiRequest.mockResolvedValue({ data: [] });
  });

  it("deduplica y reutiliza las consultas de reuniones, tareas y notas", async () => {
    await Promise.all([
      getAgendaMeetings({ cacheScope: "cuenta-1" }),
      getAgendaMeetings({ cacheScope: "cuenta-1" }),
      getTareas({ cacheScope: "cuenta-1" }),
      getTareas({ cacheScope: "cuenta-1" }),
      getNotasPersonales({ cacheScope: "cuenta-1" }),
      getNotasPersonales({ cacheScope: "cuenta-1" }),
    ]);

    expect(apiRequest).toHaveBeenCalledTimes(3);
  });

  it("separa la caché por cuenta", async () => {
    await getTareas({ cacheScope: "cuenta-1" });
    await getTareas({ cacheScope: "cuenta-2" });
    await getNotasPersonales({ cacheScope: "cuenta-1" });
    await getNotasPersonales({ cacheScope: "cuenta-2" });

    expect(apiRequest).toHaveBeenCalledTimes(4);
  });

  it("invalida las tareas modificadas sin descartar su directorio", async () => {
    await getTareas({ cacheScope: "cuenta-1" });
    await getTareaIntegrantes({ cacheScope: "cuenta-1" });
    await createTarea({
      titulo: "Preparar informe",
      asignada_a: 4,
      prioridad: "media",
    });
    await getTareas({ cacheScope: "cuenta-1" });
    await getTareaIntegrantes({ cacheScope: "cuenta-1" });

    expect(apiRequest).toHaveBeenCalledTimes(4);
  });

  it("invalida las notas después de una mutación", async () => {
    await getNotasPersonales({ cacheScope: "cuenta-1" });
    await createNotaPersonal({ titulo: "Recordatorio", contenido: "Revisar agenda" });
    await getNotasPersonales({ cacheScope: "cuenta-1" });

    expect(apiRequest).toHaveBeenCalledTimes(3);
  });
});
