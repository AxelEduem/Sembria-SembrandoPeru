import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AreaFormDialog from "./AreaFormDialog";

describe("AreaFormDialog", () => {
  it("valida el nombre obligatorio", async () => {
    const onSubmit = vi.fn();

    render(
      <AreaFormDialog
        open
        area={null}
        loading={false}
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: /guardar área/i }).closest("form"));

    expect(screen.getByText("El nombre del área es obligatorio.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("normaliza y entrega los valores del formulario", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ success: true });
    const onOpenChange = vi.fn();

    render(
      <AreaFormDialog
        open
        area={null}
        loading={false}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Nombre"), "tecnología");
    await user.type(screen.getByLabelText("Descripción"), "  Soporte institucional  ");
    await user.click(screen.getByRole("button", { name: /guardar área/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      nombre: "TECNOLOGÍA",
      descripcion: "Soporte institucional",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
