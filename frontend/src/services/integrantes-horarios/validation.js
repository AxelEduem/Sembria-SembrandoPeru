import {
  DIAS_SEMANA,
  DURACION_MINIMA_BLOQUE_MINUTOS,
  HORA_MAXIMA,
  HORA_MINIMA,
  HORAS_MINIMAS_SEMANALES,
} from "./constants";
import { idOf, normalizeDatabaseTime, timeMinutes } from "./utils";

const dayOf = (value) => {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 6 ? day : null;
};
const dayLabel = (day) => DIAS_SEMANA.find((item) => item.value === Number(day))?.label || "día";
export function calculateDurationMinutes(start, end) {
  const a = timeMinutes(start),
    b = timeMinutes(end);
  return a === null || b === null || b <= a ? 0 : b - a;
}
export const calculateDurationHours = (start, end) => calculateDurationMinutes(start, end) / 60;
export function formatHours(hours) {
  const value = Number(hours);
  return !Number.isFinite(value) || value < 0
    ? "0 horas"
    : `${value} ${value === 1 ? "hora" : "horas"}`;
}
export function validateHorarioBlock(block) {
  const day = dayOf(block?.dia_semana),
    start = timeMinutes(block?.hora_inicio),
    end = timeMinutes(block?.hora_fin);
  if (!day || start === null || end === null) return "El bloque de horario no es valido.";
  if (start < timeMinutes(HORA_MINIMA) || end > timeMinutes(HORA_MAXIMA))
    return `El horario debe estar entre ${HORA_MINIMA} y ${HORA_MAXIMA}.`;
  if (end <= start) return `La hora de fin del ${dayLabel(day).toLowerCase()} debe ser posterior.`;
  if (end - start < DURACION_MINIMA_BLOQUE_MINUTOS)
    return `Cada bloque de horario debe durar al menos ${formatHours(DURACION_MINIMA_BLOQUE_MINUTOS / 60)}.`;
  return "";
}
export function validateHorarioBlocks(blocks) {
  if (!Array.isArray(blocks)) return "El horario seleccionado no es valido.";
  for (const block of blocks) {
    const error = validateHorarioBlock(block);
    if (error) return error;
  }
  const byDay = new Map();
  blocks.forEach((block) => {
    const day = Number(block.dia_semana);
    byDay.set(day, [...(byDay.get(day) || []), block]);
  });
  for (const [day, dayBlocks] of byDay) {
    const sorted = [...dayBlocks].sort(
      (a, b) => timeMinutes(a.hora_inicio) - timeMinutes(b.hora_inicio),
    );
    for (let i = 1; i < sorted.length; i += 1)
      if (timeMinutes(sorted[i].hora_inicio) < timeMinutes(sorted[i - 1].hora_fin))
        return `Los horarios del ${dayLabel(day).toLowerCase()} no pueden superponerse.`;
  }
  return "";
}
export function sortHorarioBlocks(blocks = []) {
  return [...blocks].sort(
    (a, b) =>
      Number(a.dia_semana) - Number(b.dia_semana) ||
      timeMinutes(a.hora_inicio) - timeMinutes(b.hora_inicio),
  );
}
export function areHorarioBlocksEqual(first = [], second = []) {
  if (!Array.isArray(first) || !Array.isArray(second)) return false;
  const comparable = (blocks) =>
    blocks
      .map((b) => [
        Number(b?.dia_semana),
        normalizeDatabaseTime(b?.hora_inicio),
        normalizeDatabaseTime(b?.hora_fin),
      ])
      .sort(
        (a, b) =>
          String(a[0]).localeCompare(String(b[0])) ||
          String(a[1]).localeCompare(String(b[1])) ||
          String(a[2]).localeCompare(String(b[2])),
      );
  return JSON.stringify(comparable(first)) === JSON.stringify(comparable(second));
}
export const calculateWeeklyMinutes = (blocks = []) =>
  blocks.reduce(
    (total, block) => total + calculateDurationMinutes(block.hora_inicio, block.hora_fin),
    0,
  );
export const calculateWeeklyHours = (blocks = []) => calculateWeeklyMinutes(blocks) / 60;
function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;

  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
    ? date
    : null;
}
export function calculatePeriodHours(blocks = [], fechaInicio, fechaFin) {
  const start = parseDateOnly(fechaInicio);
  const end = parseDateOnly(fechaFin);

  if (!start || !end || end < start || !Array.isArray(blocks) || !blocks.length) return 0;

  let totalMinutes = 0;
  const current = new Date(start);

  while (current <= end) {
    const javascriptDay = current.getUTCDay();
    const day = javascriptDay === 0 ? 7 : javascriptDay;

    totalMinutes += blocks
      .filter((block) => Number(block.dia_semana) === day)
      .reduce(
        (total, block) => total + calculateDurationMinutes(block.hora_inicio, block.hora_fin),
        0,
      );

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return Math.round((totalMinutes / 60) * 100) / 100;
}
export function validateMinimumPracticePeriodHours(
  blocks = [],
  fechaInicio,
  fechaFin,
  requiredHours,
) {
  const required = Number(requiredHours);
  if (!Number.isFinite(required) || required <= 0) return "";

  const projected = calculatePeriodHours(blocks, fechaInicio, fechaFin);

  return projected >= required
    ? ""
    : `El horario del periodo suma ${formatHours(projected)}, pero el practicante requiere como mínimo ${formatHours(required)}.`;
}
export const calculateDailyHours = (blocks = [], day) =>
  blocks
    .filter((b) => Number(b.dia_semana) === Number(day))
    .reduce((total, b) => total + calculateDurationHours(b.hora_inicio, b.hora_fin), 0);
export const getDailyHoursSummary = (blocks = []) =>
  DIAS_SEMANA.map((day) => ({
    ...day,
    hours: calculateDailyHours(blocks, day.value),
    label: formatHours(calculateDailyHours(blocks, day.value)),
  }));
export const validateMinimumWeeklyHours = (blocks = []) =>
  calculateWeeklyHours(blocks) >= HORAS_MINIMAS_SEMANALES
    ? ""
    : `El horario debe tener al menos ${HORAS_MINIMAS_SEMANALES} horas semanales.`;
export const getHorarioSummary = (blocks = []) => {
  const sorted = sortHorarioBlocks(blocks);
  return {
    blocks: sorted,
    weeklyMinutes: calculateWeeklyMinutes(sorted),
    weeklyHours: calculateWeeklyHours(sorted),
  };
};
export function buildHorarioBlock({
  historialId,
  historial_id: hId,
  integranteId,
  integrante_id: iId,
  diaSemana,
  horaInicio,
  horaFin,
  dia_semana: day,
  hora_inicio: start,
  hora_fin: end,
  id = null,
}) {
  return {
    ...(id ? { id: Number(id) } : {}),
    historial_id: idOf(hId ?? historialId ?? iId ?? integranteId),
    dia_semana: Number(day ?? diaSemana),
    hora_inicio: start ?? horaInicio,
    hora_fin: end ?? horaFin,
  };
}
