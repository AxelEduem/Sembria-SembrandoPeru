const TYPE_LABELS = {
  voluntario: "Voluntarios",
  practicante: "Practicantes",
  gerente: "Gerentes",
};

const MODALITY_LABELS = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
  híbrido: "Híbrido",
};

function capitalize(value) {
  const text = String(value || "").trim();
  return text ? `${text.charAt(0).toLocaleUpperCase("es-PE")}${text.slice(1)}` : "Sin dato";
}

function dateOnly(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function groupRows(rows, valueOf, labelOf = capitalize) {
  const counts = new Map();

  rows.forEach((row) => {
    const rawValue = valueOf(row);
    const key = String(rawValue || "sin-dato")
      .trim()
      .toLocaleLowerCase("es-PE");
    const current = counts.get(key) || {
      name: labelOf(rawValue),
      total: 0,
      active: 0,
      inactive: 0,
    };
    current.total += 1;
    current.active += row.activo ? 1 : 0;
    current.inactive += row.activo ? 0 : 1;
    counts.set(key, current);
  });

  return [...counts.values()].sort((first, second) => second.total - first.total);
}

function getMonthlyRegistrations(rows, monthCount = 6) {
  const now = new Date();
  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      name: new Intl.DateTimeFormat("es-PE", { month: "short" }).format(date).replace(".", ""),
      total: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));

  rows.forEach((row) => {
    const date = new Date(row.created_at);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = byKey.get(key);
    if (month) month.total += 1;
  });

  return months;
}

export function buildIntegrantesMetrics(rows = []) {
  const integrantes = Array.isArray(rows) ? rows : [];
  const active = integrantes.filter((row) => row.activo);
  const inactive = integrantes.filter((row) => !row.activo);
  const practitioners = integrantes.filter((row) => row.tipo_integrante === "practicante");
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingEndings = active.filter((row) => {
    const end = dateOnly(row.fecha_fin);
    if (!end) return false;
    const days = Math.ceil((end.getTime() - todayUtc) / 86400000);
    return days >= 0 && days <= 30;
  }).length;
  const practiceHours = practitioners.reduce(
    (total, row) => total + (Number(row.horas_practicas_requeridas) || 0),
    0,
  );

  return {
    total: integrantes.length,
    active: active.length,
    inactive: inactive.length,
    activeRate: integrantes.length ? Math.round((active.length / integrantes.length) * 100) : 0,
    practitioners: practitioners.length,
    upcomingEndings,
    practiceHours,
    averagePracticeHours: practitioners.length
      ? Math.round(practiceHours / practitioners.length)
      : 0,
    byStatus: [
      { name: "Activos", total: active.length },
      { name: "Inactivos", total: inactive.length },
    ],
    byType: groupRows(
      integrantes,
      (row) => row.tipo_integrante,
      (value) => TYPE_LABELS[value] || capitalize(value),
    ),
    byArea: groupRows(integrantes, (row) => row.area),
    byModality: groupRows(
      integrantes,
      (row) => row.modalidad,
      (value) =>
        MODALITY_LABELS[String(value || "").toLocaleLowerCase("es-PE")] || capitalize(value),
    ),
    byPeriod: groupRows(
      integrantes.filter((row) => row.periodo_meses),
      (row) => row.periodo_meses,
      (value) => `${value} ${Number(value) === 1 ? "mes" : "meses"}`,
    ),
    byDepartment: groupRows(integrantes, (row) => row.departamento).slice(0, 8),
    monthlyRegistrations: getMonthlyRegistrations(integrantes),
  };
}
