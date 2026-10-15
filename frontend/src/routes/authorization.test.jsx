import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

let authState;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

function renderRoutes(routeElement) {
  return render(
    <MemoryRouter initialEntries={["/privado"]}>
      <Routes>
        <Route element={routeElement}>
          <Route path="/privado" element={<div>Contenido protegido</div>} />
        </Route>
        <Route path="/" element={<div>Inicio de sesión</div>} />
        <Route path="/acceso-denegado" element={<div>Acceso denegado</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("rutas protegidas", () => {
  beforeEach(() => {
    authState = {
      isAuthenticated: true,
      loading: false,
      profile: {
        role: { activo: true, acceso_total: false },
        permissions: [{ codigo: "areas.ver", alcance: "area", activo: true }],
      },
    };
  });

  it("envia al login cuando no existe una sesion", () => {
    authState = { ...authState, isAuthenticated: false, profile: null };
    renderRoutes(<ProtectedRoute />);
    expect(screen.getByText("Inicio de sesión")).toBeInTheDocument();
  });

  it("permite entrar con el permiso requerido", () => {
    renderRoutes(<RoleRoute requiredPermission="areas.ver" />);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("bloquea una ruta sin el permiso requerido", () => {
    renderRoutes(<RoleRoute requiredPermission="areas.editar" />);
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
  });

  it("bloquea una ruta global cuando el permiso solo tiene alcance de area", () => {
    renderRoutes(<RoleRoute requiredPermission="areas.ver" requiredScope="global" />);
    expect(screen.getByText("Acceso denegado")).toBeInTheDocument();
  });

  it("permite una ruta global cuando el permiso tiene alcance global", () => {
    authState.profile.permissions[0].alcance = "global";
    renderRoutes(<RoleRoute requiredPermission="areas.ver" requiredScope="global" />);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });

  it("permite cualquier ruta a un rol activo con acceso total", () => {
    authState.profile.role.acceso_total = true;
    authState.profile.permissions = [];
    renderRoutes(<RoleRoute requiredPermission="roles.gestionar_permisos" />);
    expect(screen.getByText("Contenido protegido")).toBeInTheDocument();
  });
});
