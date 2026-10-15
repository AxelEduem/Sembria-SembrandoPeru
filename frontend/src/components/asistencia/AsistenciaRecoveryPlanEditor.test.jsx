import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { proponerRecuperacionIncidencia } from "@/services/asistencia/asistenciaService";
import AsistenciaRecoveryPlanEditor from "./AsistenciaRecoveryPlanEditor";

vi.mock("@/services/asistencia/asistenciaService", () => ({
  proponerRecuperacionIncidencia: vi.fn(),
}));

vi.mock("@/utils/asistenciaDateUtils", () => ({
  getTodayLimaISO: () => "2026-10-12",
}));

describe("AsistenciaRecoveryPlanEditor", () => {
  it("limita el plan manual y automático a fechas posteriores a hoy", async () => {
    const user = userEvent.setup();
    const setRecoveries = vi.fn();
    proponerRecuperacionIncidencia.mockResolvedValue({ recuperaciones: [] });

    render(
      <AsistenciaRecoveryPlanEditor
        requiredMinutes={60}
        incidentDate="2026-10-07"
        recoveries={[{ fecha: "", hora_inicio: "", hora_fin: "" }]}
        setRecoveries={setRecoveries}
      />,
    );

    expect(screen.getByLabelText("Fecha")).toHaveAttribute("min", "2026-10-13");

    await user.click(screen.getByRole("button", { name: "Generar automático" }));

    expect(proponerRecuperacionIncidencia).toHaveBeenCalledWith(60, "2026-10-12", 1);
  });
});
