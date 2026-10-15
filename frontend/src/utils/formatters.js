const INSTITUTIONAL_TIME_ZONE = "America/Lima";

function parseDateForDisplay(value) {
  if (!value) return null;

  const text = String(value).trim();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return {
      date: new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12)),
      timeZone: "UTC",
    };
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;

  return { date, timeZone: INSTITUTIONAL_TIME_ZONE };
}

function formatWithOptions(value, options) {
  const parsed = parseDateForDisplay(value);
  if (!parsed) return "-";

  return new Intl.DateTimeFormat("es-PE", {
    ...options,
    timeZone: parsed.timeZone,
  }).format(parsed.date);
}

export function formatDate(value) {
  return formatWithOptions(value, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value) {
  return formatWithOptions(value, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(".", "");
}

export function getInitials(nombre) {
  if (!nombre) return "";
  return String(nombre)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
