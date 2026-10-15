import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useTareas } from "@/hooks/useTareas";
import Tareas from "./Tareas";

vi.mock("@/hooks/useTareas", () => ({ useTareas: vi.fn() }));
const mocks = vi.hoisted(() => ({ downloadExcel: vi.fn() }));
vi.mock("@/utils/excelExport", () => ({
  downloadExcel: mocks.downloadExcel,
  formatExcelDate: (value) => value || "",
}));

const changeStatus = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter>
      <Tareas />
    </MemoryRouter>,
  );
}

const tasks = [
  {
    id: 1,
    titulo: "Preparar reporte",
    descripcion: "Consolidar avances",
    prioridad: "alta",
    estado: "pendiente",
    fecha_limite: "2099-10-10",
    soy_creador: false,
    soy_responsable: true,
    creador: { id: "creator", nombre: "Ana Coordinadora" },
    responsable: { id: "me", nombre: "Bruno Responsable" },
    responsables: [
      { id: "me", nombre: "Bruno Responsable" },
      { id: "support", nombre: "Elena Apoyo" },
    ],
    notas: [],
  },
  {
    id: 2,
    titulo: "Revisar propuesta",
    descripcion: "Validar documento",
    prioridad: "media",
    estado: "en_progreso",
    fecha_limite: null,
    soy_creador: true,
    soy_responsable: false,
    creador: { id: "me", nombre: "Bruno Responsable" },
    responsable: { id: "other", nombre: "Carla Integrante" },
    notas: [],
  },
];

describe("módulo de tareas", () => {
  beforeEach(() => {
    changeStatus.mockReset();
    changeStatus.mockResolvedValue(tasks[0]);
    mocks.downloadExcel.mockReset();
    mocks.downloadExcel.mockResolvedValue(undefined);
    useTareas.mockReturnValue({
      tasks,
      people: [],
      loading: false,
      saving: false,
      error: "",
      feedback: null,
      clearFeedback: vi.fn(),
      refresh: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      changeStatus,
      addNote: vi.fn(),
    });
  });

  it("separa las tareas recibidas de las asignadas por la persona", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Vista de tareas"), {
      target: { value: "mine" },
    });

    expect(screen.getByText("Preparar reporte")).toBeInTheDocument();
    expect(screen.getByText("Bruno Responsable, Elena Apoyo")).toBeInTheDocument();
    expect(screen.queryByText("Revisar propuesta")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Vista de tareas"), {
      target: { value: "assigned" },
    });
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "en_progreso" },
    });

    expect(screen.getByText("Revisar propuesta")).toBeInTheDocument();
    expect(screen.queryByText("Preparar reporte")).not.toBeInTheDocument();
  });

  it("muestra pendientes por defecto y abre el detalle al presionar la tarjeta", () => {
    renderPage();

    expect(screen.getByLabelText("Estado")).toHaveValue("pendiente");
    expect(screen.queryByRole("option", { name: "Tareas activas" })).not.toBeInTheDocument();
    expect(screen.getByText("Preparar reporte")).toBeInTheDocument();
    expect(screen.queryByText("Revisar propuesta")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver detalle" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir detalle de Preparar reporte" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "2 responsables" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fecha límite" })).toBeInTheDocument();
  });

  it("permite completar rápidamente una tarea propia", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Completar Preparar reporte" }));

    expect(changeStatus).toHaveBeenCalledWith(1, "completada");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("no permite editar una tarea que ya está en progreso", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "en_progreso" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Abrir detalle de Revisar propuesta" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reabrir tarea" })).not.toBeInTheDocument();
  });

  it("descarga en Excel solamente las tareas visibles", async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Vista de tareas"), {
      target: { value: "mine" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Descargar Excel" }));

    await waitFor(() => expect(mocks.downloadExcel).toHaveBeenCalledTimes(1));
    const [report, filename] = mocks.downloadExcel.mock.calls[0];
    expect(filename).toBe("tareas.xlsx");
    expect(report.data).toHaveLength(1);
    expect(report.data[0][1]).toBe("Preparar reporte");
  });
});
