const BORDER_COLOR = "#D9E2DD";
const BORDER_STYLE = "thin";

function getReportTitle(filename) {
  return filename
    .replace(/\.(xls|xlsx)$/i, "")
    .replaceAll("_", " ")
    .toLocaleUpperCase();
}

function getColumnWidth(header, rows) {
  if (header.toLocaleLowerCase() === "correo") return 34;

  const maxContentLength = rows.reduce((maxLength, row) => {
    const cell = row[header];
    return Math.max(maxLength, String(cell ?? "").length);
  }, header.length);

  return Math.min(Math.max(maxContentLength + 3, 14), 38);
}

function withBorder(style, color = BORDER_COLOR) {
  return {
    ...style,
    borderColor: color,
    borderStyle: BORDER_STYLE,
  };
}

export function buildExcelSheet(rows, filename, generatedAt = new Date()) {
  const headers = rows.headers;
  const dataRows = rows.data.map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] === "" || row[index] == null ? "-" : row[index];
      return record;
    }, {}),
  );
  const columnCount = Math.max(headers.length, 1);
  const mergedTail = Array.from({ length: columnCount - 1 }, () => null);
  const generatedLabel = new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(generatedAt);

  const titleCell = withBorder({
    value: getReportTitle(filename),
    columnSpan: columnCount,
    fontWeight: "bold",
    fontSize: 16,
    textColor: "#FFFFFF",
    backgroundColor: "#2D5A3D",
    align: "left",
    alignVertical: "center",
    height: 26,
  });
  const metaCell = withBorder({
    value: `Generado: ${generatedLabel} | Registros: ${dataRows.length}`,
    columnSpan: columnCount,
    fontWeight: "bold",
    textColor: "#2D5A3D",
    backgroundColor: "#EAF4EE",
    align: "left",
    alignVertical: "center",
  });
  const headerRow = headers.map((header) =>
    withBorder(
      {
        value: header,
        fontWeight: "bold",
        textColor: "#1F3A2A",
        backgroundColor: "#DCEEDF",
        align: "left",
        alignVertical: "center",
        wrap: true,
      },
      "#AFCDB8",
    ),
  );
  const bodyRows = dataRows.map((row, rowIndex) =>
    headers.map((header) => {
      const value = row[header];

      return withBorder({
        value,
        backgroundColor: rowIndex % 2 === 0 ? "#F8FBF9" : "#FFFFFF",
        alignVertical: "top",
        wrap: true,
        ...(value === "-" ? { fontStyle: "italic", textColor: "#94A3B8" } : {}),
      });
    }),
  );

  return {
    data: [
      [titleCell, ...mergedTail],
      [metaCell, ...mergedTail],
      Array.from({ length: columnCount }, () => null),
      headerRow,
      ...bodyRows,
    ],
    columns: headers.map((header) => ({ width: getColumnWidth(header, dataRows) })),
  };
}

export async function downloadExcel(rows, filename) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const normalizedFilename = filename.replace(/\.(xls|xlsx)$/i, ".xlsx");
  const sheet = buildExcelSheet(rows, normalizedFilename);

  return writeExcelFile(
    sheet.data,
    {
      columns: sheet.columns,
      sheet: "Reporte",
      stickyRowsCount: 4,
    },
    {
      fontFamily: "Calibri",
      fontSize: 11,
    },
  ).toFile(normalizedFilename);
}

export function formatExcelDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
