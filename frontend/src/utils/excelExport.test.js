import { beforeEach, describe, expect, it, vi } from "vitest";

const { toFile, writeExcelFile } = vi.hoisted(() => {
  const toFileMock = vi.fn();

  return {
    toFile: toFileMock,
    writeExcelFile: vi.fn(() => ({ toFile: toFileMock })),
  };
});

vi.mock("write-excel-file/browser", () => ({ default: writeExcelFile }));

import { buildExcelSheet, downloadExcel, formatExcelDate } from "./excelExport";

describe("excelExport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toFile.mockResolvedValue(undefined);
  });

  it("construye una hoja con título, metadatos, estilos y valores vacíos normalizados", () => {
    const generatedAt = new Date("2026-10-04T15:30:00-05:00");
    const sheet = buildExcelSheet(
      {
        headers: ["Nombre", "Correo"],
        data: [["Ana", ""], ["Nombre especialmente largo", "ana@example.com"]],
      },
      "integrantes.xls",
      generatedAt,
    );

    expect(sheet.data).toHaveLength(6);
    expect(sheet.data[0][0]).toMatchObject({
      value: "INTEGRANTES",
      columnSpan: 2,
      backgroundColor: "#2D5A3D",
    });
    expect(sheet.data[1][0].value).toContain("Registros: 2");
    expect(sheet.data[3][0]).toMatchObject({ value: "Nombre", fontWeight: "bold" });
    expect(sheet.data[4][1]).toMatchObject({
      value: "-",
      fontStyle: "italic",
      textColor: "#94A3B8",
    });
    expect(sheet.columns).toEqual([{ width: 29 }, { width: 34 }]);
  });

  it("genera y descarga siempre un archivo xlsx", async () => {
    await downloadExcel({ headers: ["Nombre"], data: [["Ana"]] }, "reporte.xls");

    expect(writeExcelFile).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ sheet: "Reporte", stickyRowsCount: 4 }),
      expect.objectContaining({ fontFamily: "Calibri" }),
    );
    expect(toFile).toHaveBeenCalledWith("reporte.xlsx");
  });

  it("mantiene valores inválidos y formatea fechas válidas", () => {
    expect(formatExcelDate("")).toBe("");
    expect(formatExcelDate("fecha-invalida")).toBe("fecha-invalida");
    expect(formatExcelDate("2026-10-04T12:00:00-05:00")).toBe("04/10/2026");
  });
});
