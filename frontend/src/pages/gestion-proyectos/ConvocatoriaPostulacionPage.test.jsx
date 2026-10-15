import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EnvioPostulacionWorkspace } from "./ConvocatoriaPostulacionPage";

const postulacion = {
  id: 10,
  estado: "lista_para_enviar",
  lider_idear_nombre: "María Pérez",
  fecha_identificacion: "2026-12-01",
  fecha_revision_diseno: "2026-12-02",
  fecha_revision_evidencias: "2026-12-03",
  fecha_revision_armado: "2026-12-04",
  fecha_revision_primera_replica: "2026-12-05",
  rango_postulacion: "15_25",
};

describe("envío de postulación a IDEAR", () => {
  it("permite elegir 30 o 45 días y envía la fecha de radicado con el plazo", () => {
    const onSubmit = vi.fn();
    render(
      <EnvioPostulacionWorkspace
        postulacion={postulacion}
        seguimiento={null}
        onSubmit={onSubmit}
        busy={false}
      />,
    );

    const responseTerm = screen.getByLabelText(/Plazo de respuesta/i);
    expect(within(responseTerm).getByRole("option", { name: "30 días" })).toBeInTheDocument();
    expect(within(responseTerm).getByRole("option", { name: "45 días" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Fecha de radicado/i), {
      target: { value: "2026-12-31" },
    });
    fireEvent.change(responseTerm, { target: { value: "45" } });

    expect(screen.getByLabelText(/Fecha estimada de respuesta/i)).toHaveValue("2027-02-14");
    fireEvent.click(screen.getByRole("button", { name: "Registrar envío a IDEAR" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar envío a IDEAR" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        fecha_envio: "2026-12-31",
        plazo_respuesta_dias: "45",
        rango_postulacion: "15_25",
      }),
    );
  });
});
