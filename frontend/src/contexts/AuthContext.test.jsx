import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "./AuthContext";
import {
  getCurrentUser,
  getPermissionsVersion,
} from "../services/authService";

vi.mock("../services/authService", () => ({
  getCurrentUser: vi.fn(),
  getPermissionsVersion: vi.fn(),
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
}));

vi.mock("../components/layout/LoginTransition.jsx", () => ({
  default: () => null,
}));

vi.mock("../components/layout/LogoutTransition.jsx", () => ({
  default: () => null,
}));

const profile = (version, permissionCode = "areas.ver") => ({
  id: "account-1",
  activo: true,
  permissions_version: version,
  persona: { id: "person-1", nombres: "ANA", apellidos: "PÉREZ" },
  integrante: { id: 1, estado: "Activo" },
  historial: { id: 1, tipo_integrante: "voluntario" },
  cargo: { id: 1, nombre: "COORDINADORA", activo: true },
  area: { id: 1, nombre: "SISTEMAS", activo: true },
  role: { id: 1, codigo: "coordinador_area", activo: true },
  permissions: [{ codigo: permissionCode, alcance: "area" }],
});

function ProfileProbe() {
  const { profile: currentProfile } = useAuth();

  return (
    <span data-testid="permission">
      {currentProfile?.permissions?.[0]?.codigo ?? "loading"}
    </span>
  );
}

async function initialize(initialProfile) {
  getCurrentUser.mockResolvedValueOnce({
    success: true,
    user: { id: 1, name: "Ana", email: "ana@example.com" },
    profile: initialProfile,
  });

  render(
    <AuthProvider>
      <ProfileProbe />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId("permission")).not.toHaveTextContent("loading");
  });
}

describe("sincronización de permisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conserva el perfil global cuando la versión no cambia", async () => {
    await initialize(profile("version-1"));
    getPermissionsVersion.mockResolvedValue({
      success: true,
      permissions_version: "version-1",
    });

    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => expect(getPermissionsVersion).toHaveBeenCalledOnce());
    expect(getCurrentUser).toHaveBeenCalledOnce();
  });

  it("recarga el perfil completo cuando cambia la versión", async () => {
    await initialize(profile("version-1"));
    getPermissionsVersion.mockResolvedValue({
      success: true,
      permissions_version: "version-2",
    });
    getCurrentUser.mockResolvedValueOnce({
      success: true,
      user: { id: 1, name: "Ana", email: "ana@example.com" },
      profile: profile("version-2", "areas.editar"),
    });

    act(() => window.dispatchEvent(new Event("focus")));

    await waitFor(() => {
      expect(screen.getByTestId("permission")).toHaveTextContent("areas.editar");
    });
    expect(getCurrentUser).toHaveBeenCalledTimes(2);
  });
});
