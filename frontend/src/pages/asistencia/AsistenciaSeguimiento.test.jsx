import { act, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCalendarioAsistencia, getSeguimientoJornadas } from "@/services/asistencia/asistenciaService";
import AsistenciaSeguimiento from "./AsistenciaSeguimiento";

vi.mock("@/components/asistencia/AttendanceAdminNav", () => ({ default: () => null }));
vi.mock("@/components/asistencia/seguimiento/SeguimientoFilters", () => ({ default: () => null }));
vi.mock("@/components/asistencia/seguimiento/SeguimientoList", () => ({ default: () => null }));
vi.mock("@/components/asistencia/seguimiento/SeguimientoStyles", () => ({ default: () => null }));
vi.mock("@/components/ui/FeedbackToast", () => ({ default: () => null }));
vi.mock("@/hooks/useUrlSyncedFilters", () => ({
  default: () => ({
    readInitialFilters: () => ({
      search: "",
      area: "",
      cargo: "",
      state: "",
      date: "2026-10-12",
      page: "1",
    }),
    writeFiltersToUrl: vi.fn(),
  }),
}));
vi.mock("@/services/asistencia/asistenciaService", () => ({
  getCalendarioAsistencia: vi.fn(),
  getSeguimientoJornadas: vi.fn(),
}));
vi.mock("@/utils/attendanceTracking", () => ({
  attendanceDetailUrl: () => "/asistencia/detalle",
  attendanceStatus: () => "En jornada",
  limaToday: () => "2026-10-12",
}));
vi.mock("@/utils/excelExport", () => ({ downloadExcel: vi.fn() }));

function setConnectionState({ online = true, visibility = "visible" } = {}) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
  Object.defineProperty(document, "visibilityState", { configurable: true, value: visibility });
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("seguimiento de asistencia", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setConnectionState();
    getSeguimientoJornadas.mockResolvedValue([]);
    getCalendarioAsistencia.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("pausa el polling oculto o sin conexión y actualiza al volver a estar activo", async () => {
    render(<MemoryRouter><AsistenciaSeguimiento /></MemoryRouter>);
    await flushPromises();

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(1);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(1);

    setConnectionState({ visibility: "hidden" });
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(1);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(1);

    setConnectionState({ online: false, visibility: "visible" });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(15_000);
    });

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(1);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(1);

    setConnectionState();
    await act(async () => {
      window.dispatchEvent(new Event("online"));
      await Promise.resolve();
    });

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(2);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(2);
  });

  it("no superpone cargas mientras la solicitud anterior está pendiente", async () => {
    let resolveTracking;
    let resolveCalendar;
    getSeguimientoJornadas.mockReturnValue(new Promise((resolve) => {
      resolveTracking = resolve;
    }));
    getCalendarioAsistencia.mockReturnValue(new Promise((resolve) => {
      resolveCalendar = resolve;
    }));

    render(<MemoryRouter><AsistenciaSeguimiento /></MemoryRouter>);
    await flushPromises();

    await act(async () => {
      vi.advanceTimersByTime(45_000);
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("online"));
    });

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(1);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveTracking([]);
      resolveCalendar([]);
      await Promise.resolve();
    });

    await act(async () => {
      vi.advanceTimersByTime(15_000);
      await Promise.resolve();
    });

    expect(getSeguimientoJornadas).toHaveBeenCalledTimes(2);
    expect(getCalendarioAsistencia).toHaveBeenCalledTimes(2);
  });
});
