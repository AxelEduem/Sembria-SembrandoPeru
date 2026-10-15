import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ConvocatoriasManualPage from "./ConvocatoriasManualPage";

let profile;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ profile }),
}));

function renderManual() {
  return render(
    <MemoryRouter initialEntries={["/gestion-proyectos/detecta/convocatorias/manual"]}>
      <ConvocatoriasManualPage />
    </MemoryRouter>,
  );
}

describe("manual de convocatorias", () => {
  beforeEach(() => {
    profile = {
      role: { activo: true, acceso_total: false },
      permissions: [
        { codigo: "gp.convocatorias.ver", alcance: "area", activo: true },
        { codigo: "gp.convocatorias.evaluar", alcance: "area", activo: true },
      ],
    };
  });

  it("muestra solamente las etapas autorizadas para el perfil", () => {
    renderManual();

    expect(screen.getByRole("tab", { name: "Vista general" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Consultar y filtrar" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Primer filtro" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Segundo filtro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Aprobación" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Exportar a Excel" })).not.toBeInTheDocument();
  });

  it("incluye etapas de consulta y acciones cuando existen sus permisos", () => {
    profile.permissions.push(
      { codigo: "gp.convocatorias.ver_aprobacion", alcance: "global", activo: true },
      { codigo: "gp.convocatorias.postular", alcance: "global", activo: true },
      { codigo: "gp.convocatorias.descargar_excel", alcance: "global", activo: true },
    );

    renderManual();

    expect(screen.getByRole("tab", { name: "Aprobación" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Postulación y envío a IDEAR" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Seguimiento" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Exportar a Excel" })).toBeInTheDocument();
  });
});
