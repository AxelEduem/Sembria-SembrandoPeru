import { getMonthName } from "@/utils/cumpleanosUtils";

function toDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSameCalendarMonth(value, reference) {
  const date = toDate(value);

  return Boolean(
    date &&
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear(),
  );
}

function isSameCalendarWeek(value, reference) {
  const date = toDate(value);
  if (!date) return false;

  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function countBy(rows, getKey) {
  const counts = new Map();

  rows.forEach((row) => {
    const key = getKey(row);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));
}

export function buildCumpleanosMetrics(rows = [], reference = new Date()) {
  const validRows = rows.filter((row) => toDate(row.cumpleanos));
  const byArea = countBy(validRows, (row) => row.area || "Sin área");
  const byType = countBy(validRows, (row) => {
    const type = String(row.tipo_integrante || "Sin tipo").trim();
    return type === "Sin tipo" ? type : type.charAt(0).toUpperCase() + type.slice(1);
  });
  const monthCounts = Array.from({ length: 12 }, (_, month) => ({
    name: getMonthName(month),
    total: 0,
    month,
  }));

  validRows.forEach((row) => {
    const date = toDate(row.cumpleanos);
    monthCounts[date.getMonth()].total += 1;
  });

  return {
    total: validRows.length,
    currentMonth: validRows.filter((row) => isSameCalendarMonth(row.cumpleanos, reference)).length,
    currentWeek: validRows.filter((row) => isSameCalendarWeek(row.cumpleanos, reference)).length,
    today: validRows.filter((row) => row.dias_restantes === 0).length,
    topArea: byArea[0]?.name || "Sin datos",
    topAreaTotal: byArea[0]?.total || 0,
    byArea,
    byType,
    byMonth: monthCounts,
  };
}
