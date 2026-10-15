import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AsistenciaEarlyFinishModal from "./AsistenciaEarlyFinishModal";

describe("AsistenciaEarlyFinishModal", () => {
  it("usa el mismo ancho máximo que el modal de entrada tardía", () => {
    render(
      <AsistenciaEarlyFinishModal
        block={{
          fecha: "2026-10-12",
          hora_inicio_programada: "08:00:00",
          hora_fin_programada: "12:00:00",
        }}
        setDescription={vi.fn()}
        setReason={vi.fn()}
        setAttachment={vi.fn()}
        setRecoveries={vi.fn()}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveClass("max-w-[920px]");
  });
});
