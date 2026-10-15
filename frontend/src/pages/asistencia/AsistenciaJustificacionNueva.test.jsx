import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  crearJustificacion,
  getMiHistorial,
  proponerRecuperacionIncidencia,
} from "@/services/asistencia/asistenciaService";
import AsistenciaJustificacionNueva from "./AsistenciaJustificacionNueva";

vi.mock("@/services/asistencia/asistenciaService", () => ({
  crearJustificacion: vi.fn(),
  getMiHistorial: vi.fn(),
  proponerRecuperacionIncidencia: vi.fn(),
}));

vi.mock("@/utils/asistenciaDateUtils", async (importOriginal) => ({
  ...(await importOriginal()),
  getTodayLimaISO: () => "2026-10-07",
}));

const absence = {
  id: 42,
  fecha: "2026-10-07",
  hora_inicio_programada: "09:00:00",
  hora_fin_programada: "10:00:00",
  estado: "falta",
  minutos_incumplidos: 60,
  asistencia_justificaciones: [],
};

describe("nueva justificación de falta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMiHistorial.mockResolvedValue([absence]);
    crearJustificacion.mockResolvedValue({});
    proponerRecuperacionIncidencia.mockResolvedValue({ recuperaciones: [] });
  });

  it("muestra el motivo, el sustento y el plan de recuperación", async () => {
    render(
      <MemoryRouter initialEntries={["/asistencia/faltas/42/justificar"]}>
        <Routes>
          <Route
            path="/asistencia/faltas/:asistenciaId/justificar"
            element={<AsistenciaJustificacionNueva />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Justificar falta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Motivo de la justificación")).toBeInTheDocument();
    expect(screen.getByText("Opcional.")).toBeInTheDocument();
    expect(screen.queryByLabelText(/tipo/i)).not.toBeInTheDocument();
    expect(screen.getByText("Plan de recuperación")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generar automático" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar horario manual" })).toBeInTheDocument();
  });

  it("envía el motivo y el plan manual sin exigir un sustento", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/asistencia/faltas/42/justificar"]}>
        <Routes>
          <Route
            path="/asistencia/faltas/:asistenciaId/justificar"
            element={<AsistenciaJustificacionNueva />}
          />
          <Route path="/asistencia/faltas" element={<p>Registro de faltas</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(
      await screen.findByLabelText("Motivo de la justificación"),
      "Tuve una emergencia familiar.",
    );
    await user.click(screen.getByRole("button", { name: "Agregar horario manual" }));
    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-10-08" } });
    fireEvent.change(screen.getByLabelText("Inicio"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByLabelText("Fin"), { target: { value: "11:00" } });
    await user.click(screen.getByRole("button", { name: "Enviar justificación" }));

    expect(crearJustificacion).toHaveBeenCalledWith(42, expect.any(FormData));
    const payload = crearJustificacion.mock.calls[0][1];
    expect(payload.get("motivo")).toBe("Tuve una emergencia familiar.");
    expect(payload.has("adjunto")).toBe(false);
    expect(payload.get("recuperaciones[0][fecha]")).toBe("2026-10-08");
    expect(payload.get("recuperaciones[0][hora_inicio]")).toBe("10:00");
    expect(payload.get("recuperaciones[0][hora_fin]")).toBe("11:00");
    expect(await screen.findByText("Registro de faltas")).toBeInTheDocument();
  });
});
