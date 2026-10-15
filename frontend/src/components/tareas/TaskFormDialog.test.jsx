import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import TaskFormDialog from "./TaskFormDialog";

const people = [
  { id: "member-1", nombre: "Ana Torres", cargo: "Analista", area: "Tecnología" },
  { id: "member-2", nombre: "Luis Ramos", cargo: "Diseñador", area: "Tecnología" },
];

it("permite seleccionar varios responsables para una tarea", async () => {
  const onSubmit = vi.fn().mockResolvedValue({ id: 1 });

  render(
    <TaskFormDialog
      open
      onOpenChange={vi.fn()}
      people={people}
      task={null}
      saving={false}
      onSubmit={onSubmit}
    />,
  );

  fireEvent.change(screen.getByPlaceholderText("Ej. Preparar el reporte mensual"), {
    target: { value: "Preparar presentación" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Ana Torres/ }));
  fireEvent.click(screen.getByRole("button", { name: /Luis Ramos/ }));
  fireEvent.click(screen.getByRole("button", { name: "Asignar tarea" }));

  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  expect(onSubmit.mock.calls[0][0].asignadas_a).toEqual(["member-1", "member-2"]);
});
