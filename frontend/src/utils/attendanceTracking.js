export function limaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function minutes(value) {
  const [hour, minute] = String(value || "").slice(0, 5).split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : null;
}

function nowMinutes() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  return Number(parts.find((part) => part.type === "hour")?.value || 0) * 60
    + Number(parts.find((part) => part.type === "minute")?.value || 0);
}

export function attendanceStatus(row, date) {
  if (!row.horario_id) return "Sin jornada";
  if (row.estado === "anulada") return "Anulada por feriado";
  if (row.estado === "permiso") return "Permiso";
  if (row.justificacion_estado === "aprobada" || row.estado === "justificada") return "Justificada";
  if (row.estado === "falta") return "Falta";
  if (row.hora_entrada && row.hora_salida) {
    if (Number(row.minutos_salida_anticipada || 0) > 0) return "Salida anticipada";
    if (Number(row.minutos_tardanza || 0) > 0) return "Tardanza";
    return "Completada";
  }
  if (row.hora_entrada) return "En jornada";
  if (date < limaToday()) return "Falta";
  const start = minutes(row.hora_inicio_programada);
  return start !== null && nowMinutes() < start ? "Próximo" : "Inicio pendiente";
}

export function attendanceDetailUrl(row) {
  const params = new URLSearchParams({
    fecha: row.fecha || limaToday(),
    integrante: String(row.integrante_id || ""),
  });
  if (row.asistencia_id) params.set("asistencia", String(row.asistencia_id));
  if (row.horario_id) params.set("horario", String(row.horario_id));
  return `/asistencia/administracion/detalle?${params.toString()}`;
}
