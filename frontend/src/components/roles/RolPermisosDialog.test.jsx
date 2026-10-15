import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RolPermisosDialog from "./RolPermisosDialog";

const permissions = {
  areas: [
    {
      id: 1,
      codigo: "areas.ver",
      modulo: "areas",
      accion: "ver",
      nombre: "Ver módulo de áreas",
    },
    {
      id: 2,
      codigo: "areas.editar",
      modulo: "areas",
      accion: "editar",
      nombre: "Editar áreas",
    },
  ],
};

describe("RolPermisosDialog", () => {
  it("avisa y bloquea una acción cuando falta Ver módulo", async () => {
    const onSavePermissions = vi.fn().mockResolvedValue({ success: true });

    render(
      <RolPermisosDialog
        open
        role={{ id: 4, nombre: "Coordinación", acceso_total: false }}
        permisosPorModulo={permissions}
        onOpenChange={vi.fn()}
        onLoadPermissions={vi.fn().mockResolvedValue([])}
        onSavePermissions={onSavePermissions}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Editar áreas" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Primero debes seleccionar el permiso “Ver módulo” de Áreas.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver módulo de áreas" }));
    fireEvent.click(screen.getByRole("button", { name: "Editar áreas" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar permisos" }));

    await waitFor(() => {
      expect(onSavePermissions).toHaveBeenCalledWith(
        4,
        expect.arrayContaining([
          { permiso_id: 1, alcance: "area" },
          { permiso_id: 2, alcance: "area" },
        ]),
        { acceso_total: false },
      );
    });
  });

  it("impide guardar una asignacion heredada sin Ver modulo", async () => {
    const onSavePermissions = vi.fn().mockResolvedValue({ success: true });

    render(
      <RolPermisosDialog
        open
        role={{ id: 4, nombre: "Coordinacion", acceso_total: false }}
        permisosPorModulo={permissions}
        onOpenChange={vi.fn()}
        onLoadPermissions={vi.fn().mockResolvedValue([
          { permiso_id: 2, alcance: "area" },
        ])}
        onSavePermissions={onSavePermissions}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Guardar permisos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /debes seleccionar el permiso/i,
    );
    expect(onSavePermissions).not.toHaveBeenCalled();
  });

  it("administra el acceso total desde la parte superior del modal", async () => {
    const onSavePermissions = vi.fn().mockResolvedValue({ success: true });

    render(
      <RolPermisosDialog
        open
        role={{ id: 4, nombre: "Coordinacion", acceso_total: false }}
        permisosPorModulo={permissions}
        onOpenChange={vi.fn()}
        onLoadPermissions={vi.fn().mockResolvedValue([])}
        onSavePermissions={onSavePermissions}
      />,
    );

    const accessTotal = await screen.findByRole("checkbox", {
      name: /acceso total al sistema/i,
    });

    fireEvent.click(accessTotal);

    expect(screen.getByRole("button", { name: "Editar áreas" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Guardar permisos" }));

    await waitFor(() => {
      expect(onSavePermissions).toHaveBeenCalledWith(4, [], { acceso_total: true });
    });
  });
});
