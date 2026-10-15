import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table } from "@/components/ui/table";

describe("Table", () => {
  it("muestra un spinner accesible mientras carga", () => {
    render(
      <Table loading loadingLabel="Cargando integrantes...">
        <tbody>
          <tr>
            <td>Integrante</td>
          </tr>
        </tbody>
      </Table>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Cargando integrantes...");
    expect(screen.getByRole("table").parentElement).toHaveAttribute("aria-busy", "true");
  });

  it("no muestra el estado de carga cuando los datos están listos", () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Área administrativa</td>
          </tr>
        </tbody>
      </Table>,
    );

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText("Área administrativa")).toBeVisible();
  });
});
