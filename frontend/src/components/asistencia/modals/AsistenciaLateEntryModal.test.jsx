import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AsistenciaLateEntryModal from "./AsistenciaLateEntryModal";

describe("modal de ingreso tardío", () => {
  it("mantiene visible la hora considerada al abrir el modal", () => {
    render(
      <AsistenciaLateEntryModal
        block={{
          fecha: "2026-10-12",
          hora_inicio_programada: "08:00:00",
          hora_fin_programada: "10:00:00",
        }}
        lateMinutes={77}
        occurredAt="2026-10-12T14:17:00.000Z"
        reason="Demora inesperada en el transporte público."
        setReason={vi.fn()}
        recoveries={[{
          fecha: "2026-10-13",
          hora_inicio: "08:00",
          hora_fin: "09:17",
        }]}
        setRecoveries={vi.fn()}
        onError={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("1h 17m")).toBeInTheDocument();
    expect(screen.getByText("Hora considerada: 09:17")).toBeInTheDocument();
    expect(screen.queryByText(/hora actual/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrar ingreso" })).toBeEnabled();
  });
});
