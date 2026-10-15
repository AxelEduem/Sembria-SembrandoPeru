import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import ManualButton from "./ManualButton";

function LocationProbe() {
  const location = useLocation();

  return (
    <output>
      {location.pathname}|{location.state?.listSearch || ""}
    </output>
  );
}

describe("ManualButton", () => {
  it("navega al manual y conserva el estado recibido", () => {
    render(
      <MemoryRouter initialEntries={["/integrantes?estado=activo"]}>
        <ManualButton
          to="/integrantes/manual"
          state={{ listSearch: "?estado=activo" }}
        />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Manual" }));

    expect(screen.getByText("/integrantes/manual|?estado=activo")).toBeInTheDocument();
  });
});
