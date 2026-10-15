import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import BitacoraManualPage from "./BitacoraManualPage";

let profile;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ profile }),
}));

function renderManual() {
  return render(
    <MemoryRouter initialEntries={["/bitacora/manual"]}>
      <BitacoraManualPage />
    </MemoryRouter>,
  );
}

describe("manual de bitácora", () => {
  beforeEach(() => {
    profile = {
      role: { activo: true, acceso_total: false },
      permissions: [{ codigo: "bitacora.ver", alcance: "area", activo: true }],
    };
  });

  it("oculta las secciones que el rol no tiene autorizadas", () => {
    renderManual();

    expect(screen.getByRole("tab", { name: "Vista general" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Ver métricas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Exportar a Excel" })).not.toBeInTheDocument();
    expect(screen.getByText("por área")).toBeInTheDocument();
  });

  it("muestra métricas y exportación cuando el rol posee los permisos", () => {
    profile.permissions.push(
      { codigo: "bitacora.ver_metricas", alcance: "global", activo: true },
      { codigo: "bitacora.descargar_excel", alcance: "global", activo: true },
    );

    renderManual();

    expect(screen.getByRole("tab", { name: "Ver métricas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Exportar a Excel" })).toBeInTheDocument();
  });
});
