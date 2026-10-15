import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import IntegranteFormPracticeFields from "./IntegranteFormPracticeFields";

vi.mock("@/contexts/IntegranteFormContext", () => ({
  useIntegranteFormContext: () => ({
    isPracticante: true,
    institucionEducativa: "",
    setInstitucionEducativa: vi.fn(),
    horasPracticas: "320",
    setHorasPracticas: vi.fn(),
    carrera: "",
    setCarrera: vi.fn(),
    ciclo: "",
    setCiclo: vi.fn(),
    submitting: false,
  }),
}));

describe("IntegranteFormPracticeFields", () => {
  it("quita el foco de las horas prácticas al usar la rueda del mouse", () => {
    render(<IntegranteFormPracticeFields />);

    const input = screen.getByLabelText(/Horas prácticas requeridas/i);
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.wheel(input, { deltaY: 100 });

    expect(input).not.toHaveFocus();
    expect(input).toHaveValue(320);
  });
});
