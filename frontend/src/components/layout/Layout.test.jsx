import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";

import Layout from "./Layout";

vi.mock("./Sidebar/Sidebar", () => ({
  default: () => null,
}));

vi.mock("./header/Header", () => ({
  default: () => null,
}));

vi.mock("@/hooks/useMobileSidebar", () => ({
  default: () => [false, vi.fn()],
}));

function ModulePage({ destination, label }) {
  return (
    <Layout>
      <h1>{label}</h1>
      {destination ? <Link to={destination}>Cambiar módulo</Link> : null}
    </Layout>
  );
}

describe("Layout", () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
  });

  it("vuelve al inicio al navegar a otro módulo", async () => {
    render(
      <MemoryRouter initialEntries={["/horario"]}>
        <Routes>
          <Route
            path="/horario"
            element={
              <ModulePage
                destination="/cumpleanos"
                label="Horario"
              />
            }
          />
          <Route
            path="/cumpleanos"
            element={<ModulePage label="Cumpleaños" />}
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 0));
    window.scrollTo.mockClear();

    fireEvent.click(screen.getByRole("link", { name: "Cambiar módulo" }));

    expect(await screen.findByRole("heading", { name: "Cumpleaños" })).toBeInTheDocument();
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalledWith(0, 0));
  });
});
