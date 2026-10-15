import { describe, expect, it } from "vitest";

import { getAvatarUrl } from "./avatar";

describe("getAvatarUrl", () => {
  it("conserva URLs absolutas", () => {
    expect(getAvatarUrl("https://cdn.example.com/avatars/ana.webp")).toBe(
      "https://cdn.example.com/avatars/ana.webp",
    );
  });

  it("resuelve URLs relativas del backend contra la API", () => {
    expect(getAvatarUrl("/storage/avatars/ana.webp")).toMatch(
      /^https?:\/\/[^/]+(?::\d+)?\/storage\/avatars\/ana\.webp$/,
    );
  });

  it("resuelve rutas almacenadas de avatares", () => {
    expect(getAvatarUrl("avatars/Ana Torres.webp")).toMatch(
      /\/avatars\/Ana%20Torres\.webp$/,
    );
  });

  it("descarta valores que no son rutas de avatar", () => {
    expect(getAvatarUrl("documentos/archivo.pdf")).toBeNull();
  });
});
