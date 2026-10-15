const STAGE_LABELS = {
  deteccion: "Detección",
  primer_filtro: "Primer filtro",
  segundo_filtro: "Segundo filtro",
  aprobacion: "Aprobación",
  postulacion: "Postulación",
  seguimiento: "Seguimiento",
  cierre: "Cierre",
};

const STAGE_ORDER = Object.keys(STAGE_LABELS);

function percentage(value, total) {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function asDate(value) {
  if (!value) return null;
  const date = new Date(String(value).length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(value) {
  const date = asDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("es-PE", { month: "short", year: "2-digit" })
    .format(new Date(year, month - 1, 1))
    .replace(" de ", " ");
}

function daysBetween(start, end) {
  const first = asDate(start);
  const second = asDate(end);
  if (!first || !second) return null;
  return Math.max(0, Math.round((second - first) / 86400000));
}

function latestPostulation(item) {
  return [...(item.postulaciones || [])].sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
}

function latestFollowUp(postulation) {
  return [...(postulation?.seguimientos || [])].sort((a, b) => Number(b.id) - Number(a.id))[0] || null;
}

function summarizeTeam(team, items) {
  const decided = items.filter((item) => item.aprobacion?.decision);
  const approved = decided.filter((item) => item.aprobacion.decision === "aprobada");
  const rejected = decided.filter((item) => item.aprobacion.decision === "rechazada");
  const submitted = items.filter((item) =>
    (item.postulaciones || []).some((postulation) => postulation.estado === "enviada"));
  const closed = items.filter((item) => {
    const followUp = latestFollowUp(latestPostulation(item));
    return item.estado === "cerrada" || item.etapa === "cierre" || followUp?.estado === "cerrado";
  });
  const decisionDays = decided
    .map((item) => daysBetween(item.fecha_registro || item.created_at, item.aprobacion?.decidido_at))
    .filter((value) => value !== null);

  return {
    id: team.id,
    nombre: team.nombre,
    area: team.area?.nombre || "Sin área",
    integrantes: Number(team.integrantes_total || 0),
    registradas: items.length,
    decididas: decided.length,
    aprobadas: approved.length,
    rechazadas: rejected.length,
    enviadas: submitted.length,
    cerradas: closed.length,
    efectividad: percentage(approved.length, items.length),
    tasa_aprobacion: percentage(approved.length, decided.length),
    tasa_envio: percentage(submitted.length, approved.length),
    promedio_decision_dias: decisionDays.length
      ? Math.round((decisionDays.reduce((sum, value) => sum + value, 0) / decisionDays.length) * 10) / 10
      : null,
  };
}

function isInsidePeriod(item, filters) {
  const date = String(item.fecha_registro || item.created_at || "").slice(0, 10);
  if (!date) return false;
  if (filters.desde && date < filters.desde) return false;
  if (filters.hasta && date > filters.hasta) return false;
  return true;
}

export function buildEquipoMetrics(equipos = [], convocatorias = [], filters = {}) {
  const filtered = convocatorias.filter((item) => (
    isInsidePeriod(item, filters)
    && (!filters.equipoId || String(item.equipo_id || item.equipo?.id) === String(filters.equipoId))
  ));
  const visibleTeams = equipos.filter((team) => !filters.equipoId || String(team.id) === String(filters.equipoId));
  const byTeam = visibleTeams
    .map((team) => summarizeTeam(
      team,
      filtered.filter((item) => String(item.equipo_id || item.equipo?.id) === String(team.id)),
    ))
    .sort((first, second) => second.aprobadas - first.aprobadas
      || second.efectividad - first.efectividad
      || second.registradas - first.registradas
      || first.nombre.localeCompare(second.nombre, "es"));

  const total = byTeam.reduce((sum, team) => sum + team.registradas, 0);
  const decided = byTeam.reduce((sum, team) => sum + team.decididas, 0);
  const approved = byTeam.reduce((sum, team) => sum + team.aprobadas, 0);
  const submitted = byTeam.reduce((sum, team) => sum + team.enviadas, 0);
  const closed = byTeam.reduce((sum, team) => sum + team.cerradas, 0);
  const decisionSamples = filtered
    .map((item) => daysBetween(item.fecha_registro || item.created_at, item.aprobacion?.decidido_at))
    .filter((value) => value !== null);

  const stages = STAGE_ORDER.map((stage) => ({
    name: STAGE_LABELS[stage],
    value: filtered.filter((item) => item.etapa === stage).length,
  })).filter((item) => item.value > 0);

  const months = new Map();
  filtered.forEach((item) => {
    const registeredKey = monthKey(item.fecha_registro || item.created_at);
    if (registeredKey) {
      const row = months.get(registeredKey) || { key: registeredKey, registradas: 0, aprobadas: 0 };
      row.registradas += 1;
      months.set(registeredKey, row);
    }
    if (item.aprobacion?.decision === "aprobada") {
      const approvedKey = monthKey(item.aprobacion.decidido_at);
      if (approvedKey) {
        const row = months.get(approvedKey) || { key: approvedKey, registradas: 0, aprobadas: 0 };
        row.aprobadas += 1;
        months.set(approvedKey, row);
      }
    }
  });
  const trend = [...months.values()]
    .sort((first, second) => first.key.localeCompare(second.key))
    .slice(-12)
    .map((row) => ({ ...row, name: monthLabel(row.key) }));

  const topByRegistrations = [...byTeam].sort((a, b) => b.registradas - a.registradas)[0] || null;
  const topByApprovals = byTeam[0] || null;
  const topByEffectiveness = [...byTeam]
    .filter((team) => team.registradas > 0)
    .sort((a, b) => b.efectividad - a.efectividad || b.aprobadas - a.aprobadas)[0] || null;

  return {
    summary: {
      equipos: visibleTeams.length,
      registradas: total,
      aprobadas: approved,
      enviadas: submitted,
      cerradas: closed,
      efectividad: percentage(approved, total),
      tasa_aprobacion: percentage(approved, decided),
      promedio_decision_dias: decisionSamples.length
        ? Math.round((decisionSamples.reduce((sum, value) => sum + value, 0) / decisionSamples.length) * 10) / 10
        : null,
    },
    byTeam,
    stages,
    trend,
    approvalDistribution: [
      { name: "Aprobadas", value: approved, color: "#2D5A3D" },
      { name: "No aprobadas", value: byTeam.reduce((sum, team) => sum + team.rechazadas, 0), color: "#E11D48" },
      { name: "Pendientes", value: Math.max(0, total - decided), color: "#D97706" },
    ].filter((item) => item.value > 0),
    leaders: { topByRegistrations, topByApprovals, topByEffectiveness },
  };
}
