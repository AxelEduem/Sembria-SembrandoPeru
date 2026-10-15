function groupAssignments(assignments, valueOf, fallback) {
  const totals = new Map();

  assignments.forEach((assignment) => {
    const name = valueOf(assignment) || fallback;
    totals.set(name, (totals.get(name) || 0) + 1);
  });

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((first, second) => second.total - first.total);
}

export function buildAccessMetrics({ dashboard, activeAssignments, inactiveAssignments }) {
  const active = Array.isArray(activeAssignments) ? activeAssignments : [];
  const inactive = Array.isArray(inactiveAssignments) ? inactiveAssignments : [];
  const activeMembers = dashboard?.activos?.length || 0;
  const membersWithAccess = dashboard?.conAcceso?.length || 0;
  const allLicenseUsage = Array.isArray(dashboard?.usoAplicaciones)
    ? dashboard.usoAplicaciones
        .filter((application) => Number(application.licencias_total) > 0)
        .map((application) => ({
          name: application.nombre,
          occupied: application.ocupadas,
          available: application.disponibles,
          percentage: application.porcentaje,
        }))
        .sort((first, second) => second.percentage - first.percentage)
    : [];
  const criticalApplications = allLicenseUsage.filter(
    (application) => application.percentage >= 80,
  );
  const fullApplications = allLicenseUsage.filter((application) => application.available === 0);
  const inactiveMemberIds = new Set(
    inactive
      .map((assignment) => assignment.historial_id)
      .filter((historyId) => historyId !== null && historyId !== undefined)
      .map(String),
  );

  return {
    activeAssignments: active.length,
    activeMembers,
    membersWithAccess,
    coverageRate: activeMembers ? Math.round((membersWithAccess / activeMembers) * 100) : 0,
    licensesAvailable: dashboard?.licenciasDisponibles || 0,
    licenseOccupation: dashboard?.ocupacionLicencias || 0,
    criticalApplications: criticalApplications.length,
    fullApplications: fullApplications.length,
    pendingInactiveAssignments: inactive.length,
    inactiveMembersWithAccess: inactiveMemberIds.size,
    coverage: dashboard?.coberturaAccesos || [],
    licenseUsage: allLicenseUsage.slice(0, 10),
    registeredApplications: allLicenseUsage.length,
    byArea: (dashboard?.accesosPorArea || []).map((item) => ({
      name: item.area,
      total: item.total,
    })),
    accessLoad: dashboard?.aplicacionesPorIntegrante || [],
    pendingByApplication: groupAssignments(
      inactive,
      (assignment) => assignment.aplicacion?.nombre,
      "Aplicación sin nombre",
    ).slice(0, 8),
  };
}
