import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMiHistorial } from "@/services/asistencia/asistenciaService";
import AsistenciaFaltas from "./AsistenciaFaltas";

vi.mock("@/services/asistencia/asistenciaService", () => ({
  crearJustificacion: vi.fn(),
  getMiHistorial: vi.fn(),
}));

describe("faltas de asistencia", () => {
  beforeEach(() => {
    getMiHistorial.mockResolvedValue([
      {
        id: 42,
        fecha: "2026-10-07",
        hora_inicio_programada: "09:00:00",
        hora_fin_programada: "10:00:00",
        minutos_incumplidos: 60,
        estado: "falta",
        asistencia_justificaciones: [],
      },
      {
        id: 43,
        fecha: "2026-10-06",
        hora_inicio_programada: "09:00:00",
        hora_fin_programada: "10:00:00",
        minutos_incumplidos: 60,
        estado: "falta",
        asistencia_justificaciones: [{ id: 9, estado: "pendiente" }],
      },
    ]);
  });

  it("envía a la página de justificación al presionar Justificar falta", async () => {
    render(
      <MemoryRouter initialEntries={["/asistencia/faltas"]}>
        <AsistenciaFaltas />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("link", { name: "Justificar falta" })).toHaveAttribute(
      "href",
      "/asistencia/faltas/42/justificar",
    );
    expect(screen.getAllByText("Falta")).toHaveLength(1);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Pendientes")).not.toBeInTheDocument();
  });
});
