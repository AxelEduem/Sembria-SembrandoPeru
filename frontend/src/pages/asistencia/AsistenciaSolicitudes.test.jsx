import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMisFlujosAsistencia } from "@/services/asistencia/asistenciaService";
import AsistenciaSolicitudes from "./AsistenciaSolicitudes";

vi.mock("@/services/asistencia/asistenciaService", () => ({
  getMisFlujosAsistencia: vi.fn(),
}));

const permission = {
  id: 7,
  tipo: "personal",
  fecha_inicio: "2026-10-14",
  fecha_fin: "2026-10-14",
  fechas: [{ fecha: "2026-10-14" }],
  motivo: "Trámite personal previamente programado.",
  minutos_a_recuperar: 60,
  created_at: "2026-10-12T12:00:00Z",
  recuperaciones: [{
    id: 11,
    fecha: "2026-10-15",
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    minutos: 60,
    estado: "programada",
  }],
};

describe("solicitudes de asistencia", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el plan mientras la solicitud está pendiente", async () => {
    getMisFlujosAsistencia.mockResolvedValue({
      permisos: [{ ...permission, estado: "pendiente" }],
      justificaciones: [],
    });

    render(<MemoryRouter><AsistenciaSolicitudes /></MemoryRouter>);

    expect(await screen.findByText("Plan de recuperación")).toBeInTheDocument();
    expect(screen.getByText("15 oct. 2026")).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element.tagName === "P" && element.textContent.includes("10:00–11:00")
    ))).toBeInTheDocument();
    expect(screen.getByText("Estado: Propuesta")).toBeInTheDocument();
  });

  it("no ofrece iniciar la recuperación desde una solicitud aprobada", async () => {
    const user = userEvent.setup();
    getMisFlujosAsistencia.mockResolvedValue({
      permisos: [{ ...permission, estado: "aprobada" }],
      justificaciones: [],
    });

    render(<MemoryRouter><AsistenciaSolicitudes /></MemoryRouter>);

    await user.click(await screen.findByRole("tab", { name: "Aprobadas" }));
    expect(await screen.findByText("Plan de recuperación")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /iniciar recuperación/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /gestionar en mi asistencia/i })).not.toBeInTheDocument();
  });
});
