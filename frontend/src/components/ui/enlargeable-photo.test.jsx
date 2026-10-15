import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import EnlargeablePhoto from "./enlargeable-photo";

describe("EnlargeablePhoto", () => {
  it("abre la foto y mantiene el cierre visible sobre la imagen", async () => {
    const user = userEvent.setup();

    render(
      <EnlargeablePhoto
        src="https://example.com/ana.webp"
        alt="Foto de Ana Torres"
        className="h-10 w-10"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ampliar foto de ana torres" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto de Ana Torres" })).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "Cerrar foto ampliada" });
    expect(closeButton).toHaveClass("top-3", "left-3", "h-11");

    await user.click(closeButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("usa la ruta alternativa cuando la foto principal no carga", () => {
    render(
      <EnlargeablePhoto
        src="https://example.com/foto-vencida.webp"
        fallbackSrc="https://example.com/foto-vigente.webp"
        alt="Foto de Ana Torres"
        className="h-10 w-10"
      />,
    );

    const image = screen.getByRole("img", { name: "Foto de Ana Torres" });
    fireEvent.error(image);

    expect(screen.getByRole("img", { name: "Foto de Ana Torres" })).toHaveAttribute(
      "src",
      "https://example.com/foto-vigente.webp",
    );
  });
});
