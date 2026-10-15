export function idOf(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error("El historial seleccionado no es valido.");
  return id;
}
export function cacheKey(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
export function timeMinutes(value) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours > 23 || minutes > 59 ? null : hours * 60 + minutes;
}
export function normalizeDatabaseTime(value) {
  if (typeof value !== "string") return value;
  const match = /^(\d{2}):(\d{2}):00(?:\.0+)?$/.exec(value);
  return match ? `${match[1]}:${match[2]}` : value;
}
export function toHorarioError(error, fallback) {
  console.error(fallback, error);
  if (error?.code === "23P01") return new Error("El horario seleccionado se superpone con otro bloque del mismo dia.");
  if (error?.code === "23514") return new Error("El horario seleccionado no cumple las reglas establecidas.");
  if (error?.code === "42501" || error?.status === 401 || error?.status === 403) return new Error("No tienes permisos para realizar esta accion.");
  return new Error(error?.message || fallback);
}
