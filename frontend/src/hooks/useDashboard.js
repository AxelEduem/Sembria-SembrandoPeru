import { useCallback, useEffect, useMemo, useState } from "react";

import { loadAplicacionesShared } from "@/hooks/useAplicaciones";
import { loadIntegrantes } from "@/services/integrantes/integrantesService";

import {
  getAsignacionesAplicaciones,
  getAsignacionesAplicacionesInactivos,
} from "@/services/integrantes-accesos/integrantesAccesosService";

import { confirmIntegranteAccessesRemoved } from "@/services/integrantes/integrantesService";

function currentRows(rows = []) {
  const grouped = new Map();

  rows.forEach((row) => {
    const key = `${row.persona_id || `integrante-${row.id}`}|${row.tipo_integrante || ""}`;

    const current = grouped.get(key);

    if (
      !current ||
      (row.activo && !current.activo) ||
      new Date(row.created_at || 0) > new Date(current.created_at || 0)
    ) {
      grouped.set(key, row);
    }
  });

  return [...grouped.values()];
}

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(value, today) {
  if (!value) return null;

  const target = new Date(`${value}T00:00:00`);

  if (Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function buildAssignmentIndexes(assignments = []) {
  const byHistorial = new Map();
  const byApplication = new Map();
  const byArea = new Map();

  assignments.forEach((assignment) => {
    const historialId = assignment.historial_id;

    if (historialId != null) {
      const historialKey = String(historialId);

      if (!byHistorial.has(historialKey)) {
        byHistorial.set(historialKey, []);
      }

      byHistorial.get(historialKey).push(assignment);
    }

    const applicationId =
      assignment.aplicacion_id ?? assignment.aplicaciones?.id ?? assignment.aplicacion?.id;

    if (applicationId != null) {
      const applicationKey = String(applicationId);

      byApplication.set(applicationKey, (byApplication.get(applicationKey) || 0) + 1);
    }

    const area = assignment.integrante?.area || assignment.voluntario?.area || "Sin area";

    const currentArea = byArea.get(area) || {
      area,
      total: 0,
    };

    currentArea.total += 1;

    byArea.set(area, currentArea);
  });

  return {
    byHistorial,
    byApplication,
    byArea,
  };
}

function buildDistribution(assignmentsByHistorial) {
  const applicationsPerPerson = [];

  assignmentsByHistorial.forEach((assignments) => {
    applicationsPerPerson.push(assignments.length);
  });

  const distributionMap = new Map();

  applicationsPerPerson.forEach((count) => {
    distributionMap.set(count, (distributionMap.get(count) || 0) + 1);
  });

  return [...distributionMap.entries()]
    .map(([applications, integrantes]) => ({
      aplicaciones: Number(applications),
      applications: Number(applications),
      integrantes,
      integrantesTotal: integrantes,
      etiqueta: `${applications} aplicacion${Number(applications) === 1 ? "" : "es"}`,
    }))
    .sort((first, second) => first.aplicaciones - second.aplicaciones);
}

function useDashboard(profile = null, { includeInactiveAssignments = false } = {}) {
  const [rows, setRows] = useState([]);
  const [aplicaciones, setAplicaciones] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesInactivas, setAsignacionesInactivas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(
    async ({ force = false } = {}) => {
      if (!profile) {
        setRows([]);
        setAplicaciones([]);
        setAsignaciones([]);
        setAsignacionesInactivas([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [integrantesData, aplicacionesData, asignacionesData, inactiveAssignmentsData] =
          await Promise.all([
            loadIntegrantes({ force }),
            loadAplicacionesShared(profile, force),
            getAsignacionesAplicaciones(profile, {}, { force }),
            includeInactiveAssignments
              ? getAsignacionesAplicacionesInactivos(profile, {}, { force })
              : Promise.resolve([]),
          ]);

        setRows(integrantesData || []);
        setAplicaciones(aplicacionesData || []);
        setAsignaciones(asignacionesData || []);
        setAsignacionesInactivas(inactiveAssignmentsData || []);
      } catch (loadError) {
        setError(loadError?.message || "No se pudo cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    },
    [includeInactiveAssignments, profile],
  );

  useEffect(() => {
    let mounted = true;

    async function initialize() {
      if (!profile) {
        setRows([]);
        setAplicaciones([]);
        setAsignaciones([]);
        setAsignacionesInactivas([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [integrantesData, aplicacionesData, asignacionesData, inactiveAssignmentsData] =
          await Promise.all([
            loadIntegrantes(),
            loadAplicacionesShared(profile),
            getAsignacionesAplicaciones(profile),
            includeInactiveAssignments
              ? getAsignacionesAplicacionesInactivos(profile)
              : Promise.resolve([]),
          ]);

        if (!mounted) return;

        setRows(integrantesData || []);
        setAplicaciones(aplicacionesData || []);
        setAsignaciones(asignacionesData || []);
        setAsignacionesInactivas(inactiveAssignmentsData || []);
      } catch (loadError) {
        if (!mounted) return;

        setError(loadError?.message || "No se pudo cargar el dashboard.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [includeInactiveAssignments, profile]);

  const dashboard = useMemo(() => {
    const integrantes = currentRows(rows);

    const activos = integrantes.filter((integrante) => integrante.activo);

    const inactivos = integrantes.filter((integrante) => !integrante.activo);

    const activeHistorialIds = new Set(
      activos
        .map((integrante) => integrante.historial_id)
        .filter(Boolean)
        .map(String),
    );

    const activeAssignments = asignaciones.filter((assignment) =>
      activeHistorialIds.has(String(assignment.historial_id)),
    );

    const {
      byHistorial: assignmentsByHistorial,
      byApplication: assignmentsByApplication,
      byArea: assignmentsByArea,
    } = buildAssignmentIndexes(activeAssignments);

    const assignedHistorialIds = new Set(assignmentsByHistorial.keys());

    const sinAcceso = activos.filter(
      (integrante) => !assignedHistorialIds.has(String(integrante.historial_id)),
    );

    const conAcceso = activos.filter((integrante) =>
      assignedHistorialIds.has(String(integrante.historial_id)),
    );

    const today = getToday();
    const todayString = getTodayString();

    const vencidos = activos
      .map((integrante) => {
        const accesos = assignmentsByHistorial.get(String(integrante.historial_id)) || [];

        return {
          ...integrante,
          dias: daysUntil(integrante.fecha_fin, today),
          accesos,
          accesosCount: accesos.length,
        };
      })
      .filter(
        (integrante) =>
          integrante.fecha_fin && integrante.fecha_fin < todayString && integrante.accesosCount > 0,
      );

    const proximos = activos
      .map((integrante) => ({
        ...integrante,
        dias: daysUntil(integrante.fecha_fin, today),
      }))
      .filter(
        (integrante) => integrante.dias !== null && integrante.dias >= 0 && integrante.dias <= 30,
      )
      .sort((first, second) => first.dias - second.dias);

    const porArea = Object.values(
      activos.reduce((acc, integrante) => {
        const area = integrante.area || "Sin area";

        if (!acc[area]) {
          acc[area] = {
            area,
            total: 0,
            voluntarios: 0,
            practicantes: 0,
          };
        }

        acc[area].total += 1;

        if (integrante.tipo_integrante === "practicante") {
          acc[area].practicantes += 1;
        } else {
          acc[area].voluntarios += 1;
        }

        return acc;
      }, {}),
    );

    const porCargo = Object.values(
      activos.reduce((acc, integrante) => {
        const area = integrante.area || "Sin area";

        const cargo = integrante.cargo || "Sin cargo";

        const key = `${area}__${cargo}`;

        if (!acc[key]) {
          acc[key] = {
            area,
            cargo,
            total: 0,
            voluntarios: 0,
            practicantes: 0,
          };
        }

        acc[key].total += 1;

        if (integrante.tipo_integrante === "practicante") {
          acc[key].practicantes += 1;
        } else {
          acc[key].voluntarios += 1;
        }

        return acc;
      }, {}),
    );

    const usoAplicaciones = aplicaciones
      .map((aplicacion) => {
        const ocupadas = assignmentsByApplication.get(String(aplicacion.id)) || 0;

        const total = Number(aplicacion.licencias_total || 0);

        return {
          ...aplicacion,
          ocupadas,
          disponibles: Math.max(total - ocupadas, 0),
          porcentaje: total ? Math.round((ocupadas / total) * 100) : 0,
        };
      })
      .sort((first, second) => second.porcentaje - first.porcentaje);

    const distribution = buildDistribution(assignmentsByHistorial);

    const accesosPorArea = [...assignmentsByArea.values()].sort(
      (first, second) => second.total - first.total,
    );

    const estadoPorArea = Object.values(
      integrantes.reduce((acc, integrante) => {
        const area = integrante.area || "Sin area";

        if (!acc[area]) {
          acc[area] = {
            area,
            activos: 0,
            inactivos: 0,
          };
        }

        if (integrante.activo) {
          acc[area].activos += 1;
        } else {
          acc[area].inactivos += 1;
        }

        return acc;
      }, {}),
    ).sort(
      (first, second) => second.activos + second.inactivos - (first.activos + first.inactivos),
    );

    const porTipo = [
      {
        name: "Voluntarios",
        value: activos.filter((integrante) => integrante.tipo_integrante === "voluntario").length,
      },
      {
        name: "Practicantes",
        value: activos.filter((integrante) => integrante.tipo_integrante === "practicante").length,
      },
    ];

    const licenseTotal = usoAplicaciones.reduce(
      (total, aplicacion) => total + Number(aplicacion.licencias_total || 0),
      0,
    );

    const licenseUsed = usoAplicaciones.reduce(
      (total, aplicacion) => total + aplicacion.ocupadas,
      0,
    );

    const licenseAvailable = Math.max(licenseTotal - licenseUsed, 0);

    const occupationPercentage = licenseTotal ? Math.round((licenseUsed / licenseTotal) * 100) : 0;

    const alertas = [
      ...vencidos.map((integrante) => ({
        id: `vencido-${integrante.id}`,
      })),
      ...proximos.map((integrante) => ({
        id: `proximo-${integrante.id}`,
      })),
      ...sinAcceso.slice(0, 8).map((integrante) => ({
        id: `sin-acceso-${integrante.id}`,
      })),
    ];

    return {
      integrantes,
      activos,
      inactivos,

      sinAcceso,
      conAcceso,

      vencidos,
      proximos,

      porArea,
      porCargo,
      porTipo,

      estadoData: [
        {
          name: "Activos",
          value: activos.length,
        },
        {
          name: "Inactivos",
          value: inactivos.length,
        },
      ],

      coberturaAccesos: [
        {
          name: "Con acceso",
          value: conAcceso.length,
        },
        {
          name: "Sin acceso",
          value: sinAcceso.length,
        },
      ],

      usoAplicaciones,

      aplicacionesPorIntegrante: distribution,

      accesosPorArea,
      estadoPorArea,

      utilizacionLicencias: [
        {
          name: "Utilizadas",
          value: licenseUsed,
        },
        {
          name: "Disponibles",
          value: licenseAvailable,
        },
      ],

      licenciasOcupadas: licenseUsed,
      licenciasDisponibles: licenseAvailable,

      ocupacionLicencias: occupationPercentage,

      alertas,
    };
  }, [aplicaciones, asignaciones, rows]);

  const refreshDashboard = useCallback(async () => {
    await loadDashboard({
      force: true,
    });
  }, [loadDashboard]);

  const confirmIntegranteAccessesRemovedHandler = useCallback(
    async (id) => {
      return confirmIntegranteAccessesRemoved(id, profile);
    },
    [profile],
  );

  return {
    loading,
    error,

    integrantes: rows,

    aplicaciones,
    asignaciones,
    asignacionesInactivas,

    dashboard,

    refreshDashboard,

    confirmIntegranteAccessesRemoved: confirmIntegranteAccessesRemovedHandler,
  };
}

export default useDashboard;
