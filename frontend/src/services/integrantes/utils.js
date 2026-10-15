export function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function getDateValue(value) {
  if (!value) return null;

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toIntegranteError(error, fallbackMessage) {
  if (!error) return new Error(fallbackMessage);

  console.error(fallbackMessage, error);

  if (error.code === "23503") {
    return new Error("El área, cargo o registro relacionado no es válido.");
  }

  if (error.code === "23505") {
    return new Error("El registro ya existe.");
  }

  if (error.code === "42501" || error.status === 401 || error.status === 403) {
    return new Error("No tienes permisos para realizar esta acción.");
  }

  return new Error(error.message || fallbackMessage);
}

export function functionErrorMessage(error, fallback) {
  if (!error) return fallback;

  console.error("Error de Edge Function:", error);
  return error.message || fallback;
}

export function validateDateOfBirth(value) {
  const date = getDateValue(value);
  const today = new Date();

  today.setHours(23, 59, 59, 999);

  if (!date) {
    throw new Error("La fecha de nacimiento es obligatoria y válida.");
  }

  if (date > today) {
    throw new Error("La fecha de nacimiento no puede ser futura.");
  }
}

export function calculatePeriodMonths(fechaInicio, fechaFin) {
  const start = getDateValue(fechaInicio);
  const end = getDateValue(fechaFin);

  if (!start || !end || end < start) return 0;

  const monthDifference =
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();

  return Math.max(1, monthDifference + (end.getDate() > start.getDate() ? 1 : 0));
}
