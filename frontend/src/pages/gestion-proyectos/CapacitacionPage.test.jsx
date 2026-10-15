import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CapacitacionPage from "./CapacitacionPage";

const { mockUseCapacitaciones } = vi.hoisted(() => ({
  mockUseCapacitaciones: vi.fn(),
}));

vi.mock("@/hooks/gestion-proyectos/useCapacitaciones", () => ({
  default: mockUseCapacitaciones,
}));

function training(overrides = {}) {
  return {
    integrante_id: 8,
    nombre: "María Proyectos",
    correo: "maria@example.test",
    estado: "en_capacitacion",
    etapa_actual: 2,
    etapa_actual_nombre: "Métodos de identificación de fondos",
    mostrar_celebracion: false,
    completada_at: null,
    celebracion_hasta: null,
    etapas: [
      { numero: 1, nombre: "Conceptos generales de proyecto", completada: true, completada_at: "2026-10-10T10:00:00+00:00" },
      { numero: 2, nombre: "Métodos de identificación de fondos", completada: false, completada_at: null },
      { numero: 3, nombre: "Desarrollo de un mini proyecto", completada: false, completada_at: null },
    ],
    ...overrides,
  };
}

function hookResult(overrides = {}) {
  return {
    items: [],
    canManage: false,
    loading: false,
    updatingId: null,
    error: "",
    reload: vi.fn(),
    completeStage: vi.fn(),
    ...overrides,
  };
}

describe("CapacitacionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra al miembro su progreso y etapa actual", () => {
    mockUseCapacitaciones.mockReturnValue(hookResult({ items: [training()] }));

    render(<CapacitacionPage />);

    expect(screen.getByText("Hola, María")).toBeInTheDocument();
    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByText(/Fase 2: Métodos de identificación/)).toBeInTheDocument();
    expect(screen.getByText("Tu etapa actual")).toBeInTheDocument();
  });

  it("celebra la capacitación terminada durante la ventana visible", () => {
    mockUseCapacitaciones.mockReturnValue(hookResult({
      items: [training({
        estado: "completada",
        etapa_actual: null,
        etapa_actual_nombre: null,
        mostrar_celebracion: true,
        completada_at: "2026-10-15T10:00:00+00:00",
        celebracion_hasta: "2026-10-16T10:00:00+00:00",
        etapas: training().etapas.map((stage) => ({ ...stage, completada: true, completada_at: "2026-10-15T10:00:00+00:00" })),
      })],
    }));

    render(<CapacitacionPage />);

    expect(screen.getByText("¡Felicitaciones, María!")).toBeInTheDocument();
    expect(screen.getByText(/Ruta completada/)).toBeInTheDocument();
    expect(screen.getByText(/Este reconocimiento estará visible hasta/)).toBeInTheDocument();
  });

  it("separa los miembros en curso del historial administrativo", async () => {
    const user = userEvent.setup();
    const completed = training({
      integrante_id: 9,
      nombre: "Ana Graduada",
      estado: "completada",
      etapa_actual: null,
      completada_at: "2026-10-15T10:00:00+00:00",
      etapas: training().etapas.map((stage) => ({ ...stage, completada: true })),
    });
    mockUseCapacitaciones.mockReturnValue(hookResult({
      canManage: true,
      items: [training(), completed],
    }));

    render(<CapacitacionPage />);

    expect(screen.getByText("María Proyectos")).toBeInTheDocument();
    expect(screen.queryByText("Ana Graduada")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Historial/ }));

    expect(screen.getByText("Ana Graduada")).toBeInTheDocument();
    expect(screen.getByText("Graduado")).toBeInTheDocument();
    expect(screen.queryByText("María Proyectos")).not.toBeInTheDocument();
  });
});
