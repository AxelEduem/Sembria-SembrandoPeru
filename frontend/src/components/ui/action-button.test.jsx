import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActionButton } from "./action-button";

describe("ActionButton", () => {
  it("muestra el estado de carga y bloquea nuevas acciones", () => {
    render(
      <ActionButton action="save" loading loadingText="Guardando...">
        Guardar cambios
      </ActionButton>,
    );

    const button = screen.getByRole("button", { name: "Guardando..." });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("aplica el patrón destructivo con un icono accesoriamente oculto", () => {
    render(
      <ActionButton action="delete" tone="danger">
        Eliminar
      </ActionButton>,
    );

    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveClass("bg-red-600");
  });
});
