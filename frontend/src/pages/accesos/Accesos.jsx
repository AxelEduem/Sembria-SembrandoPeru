import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, ShieldAlert } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useAplicaciones } from "@/hooks/useAplicaciones";
import { useAreas } from "@/hooks/useAreas";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";

import { PERMISSIONS, hasPermission } from "@/utils/permissions";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";

import AccesoAssignDialog from "@/components/accesos/AccesoAssignDialog";
import AccesoConfirmDialog from "@/components/accesos/AccesoConfirmDialog";
import AccesosFeedback from "@/components/accesos/AccesosFeedback";
import AccesosStats from "@/components/accesos/AccesosStats";
import VoluntariosSinAccesoTable from "@/components/accesos/VoluntariosSinAccesoTable";
import ManualButton from "@/components/ui/ManualButton";
import { downloadExcel } from "@/utils/excelExport";

import {
  assignAplicacionToVoluntario,
  getAsignacionesAplicaciones,
  getAsignacionesAplicacionesInactivos,
  getVoluntariosActivosParaAccesos,
  revokeAplicacionFromVoluntario,
} from "@/services/integrantes-accesos/integrantesAccesosService";

const PAGE_SIZE = 5;

function getTipoLabel(tipo) {
  if (tipo === "practicante") return "Practicante";
  if (tipo === "gerente") return "Gerente";
  return "Voluntario";
}

/* ------------------------------------------------------------------ */
/*  Sincronización de filtros con la URL                               */
/* ------------------------------------------------------------------ */

const ACCESOS_PARAM_MAP = {
  search: "q",
  areaFilter: "area",
  cargoFilter: "cargo",
  typeFilter: "tipo",
  appFilter: "app",
  accessLevelFilter: "nivel_acceso",
};

const ACCESOS_DEFAULTS = {
  search: "",
  areaFilter: "todas",
  cargoFilter: "todos",
  typeFilter: "todos",
  appFilter: "todas",
  accessLevelFilter: "todos",
};

function Accesos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  const { aplicaciones, loading: aplicacionesLoading } = useAplicaciones();
  const { areas } = useAreas();

  const canManageAccesses = hasPermission(profile, PERMISSIONS.ACCESOS_GESTIONAR);
  const canAssignAccesses = canManageAccesses;
  const canRevokeAccesses = canManageAccesses;
  const canViewMetrics = hasPermission(profile, PERMISSIONS.ACCESOS_VER_METRICAS);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.ACCESOS_DESCARGAR_EXCEL);
  const canViewInactive = hasPermission(profile, PERMISSIONS.ACCESOS_VER_INACTIVOS);

  /* -------------------- Data -------------------- */

  const [asignaciones, setAsignaciones] = useState([]);
  const [asignacionesInactivas, setAsignacionesInactivas] = useState([]);
  const [voluntarios, setVoluntarios] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState(null);

  /* -------------------- URL sync -------------------- */

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: ACCESOS_PARAM_MAP,
    defaults: ACCESOS_DEFAULTS,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  /* -------------------- Filtros (planos) -------------------- */

  const [accessSearch, setAccessSearch] = useState(() => initialFilters.search || "");

  const [accessAreaFilter, setAccessAreaFilter] = useState(
    () => initialFilters.areaFilter || "todas",
  );

  const [accessCargoFilter, setAccessCargoFilter] = useState(
    () => initialFilters.cargoFilter || "todos",
  );

  const [accessTypeFilter, setAccessTypeFilter] = useState(
    () => initialFilters.typeFilter || "todos",
  );

  const [accessAppFilter, setAccessAppFilter] = useState(() => initialFilters.appFilter || "todas");

  const [accessLevelFilter, setAccessLevelFilter] = useState(
    () => initialFilters.accessLevelFilter || "todos",
  );

  /* -------------------- Form (assign) -------------------- */

  const [voluntarioSearch, setVoluntarioSearch] = useState("");
  const [selectedVoluntarioId, setSelectedVoluntarioId] = useState("");
  const [selectedAplicacionId, setSelectedAplicacionId] = useState("");
  const [selectedAplicacionIds, setSelectedAplicacionIds] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [revokeTargets, setRevokeTargets] = useState([]);
  const [revokeAll, setRevokeAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* -------------------- Paginación -------------------- */

  const [noAccessPage, setNoAccessPage] = useState(1);

  /* ================================================================
   * CARGAR DATOS
   * ================================================================ */

  const loadData = useCallback(
    async ({ showLoader = false } = {}) => {
      if (!profile) {
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setError("");

      try {
        const [asignacionesData, asignacionesInactivasData, voluntariosData] = await Promise.all([
          getAsignacionesAplicaciones(profile),
          canViewInactive ? getAsignacionesAplicacionesInactivos(profile) : Promise.resolve([]),
          getVoluntariosActivosParaAccesos(profile),
        ]);

        setAsignaciones(asignacionesData);
        setAsignacionesInactivas(asignacionesInactivasData);
        setVoluntarios(voluntariosData);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los accesos.");
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [canViewInactive, profile],
  );

  useEffect(() => {
    if (!profile) return;
    const timer = window.setTimeout(() => loadData({ showLoader: true }), 0);
    return () => window.clearTimeout(timer);
  }, [loadData, profile]);

  /* ================================================================
   * ESTADÍSTICAS
   * ================================================================ */

  const statsByApp = useMemo(() => {
    return aplicaciones.map((aplicacion) => {
      const reportedUsage = Number(aplicacion.licencias_usadas);
      const ocupadas = Number.isFinite(reportedUsage)
        ? reportedUsage
        : asignaciones.filter((asignacion) => asignacion.aplicacion_id === aplicacion.id).length;

      const disponibles = Math.max(aplicacion.licencias_total - ocupadas, 0);

      const percent = aplicacion.licencias_total
        ? Math.min(Math.round((ocupadas / aplicacion.licencias_total) * 100), 100)
        : 0;

      return { ...aplicacion, ocupadas, disponibles, percent };
    });
  }, [aplicaciones, asignaciones]);

  const statsMap = useMemo(
    () => new Map(statsByApp.map((aplicacion) => [aplicacion.id, aplicacion])),
    [statsByApp],
  );

  /* ================================================================
   * VOLUNTARIO SELECCIONADO
   * ================================================================ */

  const selectedVoluntario = useMemo(
    () =>
      voluntarios.find(
        (voluntario) => String(voluntario.historial_id) === String(selectedVoluntarioId),
      ),
    [selectedVoluntarioId, voluntarios],
  );

  const filteredVoluntarios = useMemo(() => {
    const normalizedSearch = voluntarioSearch.trim().toLocaleLowerCase();

    if (!normalizedSearch) {
      return voluntarios.slice(0, 8);
    }

    return voluntarios
      .filter((voluntario) => {
        const nombre = voluntario.nombre.toLocaleLowerCase();
        const area = voluntario.area.toLocaleLowerCase();
        const cargo = voluntario.cargo.toLocaleLowerCase();

        return (
          nombre.includes(normalizedSearch) ||
          area.includes(normalizedSearch) ||
          cargo.includes(normalizedSearch)
        );
      })
      .slice(0, 8);
  }, [voluntarioSearch, voluntarios]);

  const aplicacionesDisponibles = useMemo(() => {
    if (!selectedVoluntario) return [];

    const selectedAreaId =
      selectedVoluntario.area_id !== null && selectedVoluntario.area_id !== undefined
        ? Number(selectedVoluntario.area_id)
        : null;

    const assignedAppIds = new Set(
      asignaciones
        .filter(
          (asignacion) =>
            String(asignacion.historial_id) === String(selectedVoluntario.historial_id),
        )
        .map((asignacion) => asignacion.aplicacion_id),
    );

    return aplicaciones.filter((aplicacion) => {
      const aplicacionAreaId =
        aplicacion.area_id !== null && aplicacion.area_id !== undefined
          ? Number(aplicacion.area_id)
          : null;

      const esAplicacionGeneral = aplicacionAreaId === null;
      const esAplicacionDelArea = selectedAreaId !== null && aplicacionAreaId === selectedAreaId;
      const perteneceAlVoluntario = esAplicacionGeneral || esAplicacionDelArea;
      const noEstaAsignada = !assignedAppIds.has(aplicacion.id);

      const stats = statsMap.get(aplicacion.id);
      const tieneLicencias = (stats?.disponibles || 0) > 0;

      return perteneceAlVoluntario && noEstaAsignada && tieneLicencias;
    });
  }, [aplicaciones, asignaciones, selectedVoluntario, statsMap]);

  const selectedAsignaciones = useMemo(
    () =>
      asignaciones.filter(
        (asignacion) => String(asignacion.historial_id) === String(selectedVoluntarioId),
      ),
    [asignaciones, selectedVoluntarioId],
  );

  const accesosPorIntegrante = useMemo(() => {
    const grouped = new Map();
    asignaciones.forEach((asignacion) => {
      const key = String(asignacion.historial_id);
      grouped.set(key, [...(grouped.get(key) || []), asignacion]);
    });
    return grouped;
  }, [asignaciones]);

  const integrantesFiltrados = useMemo(() => {
    const search = accessSearch.trim().toLocaleLowerCase();

    return voluntarios.filter((integrante) => {
      const accesos = accesosPorIntegrante.get(String(integrante.historial_id)) || [];
      const matchesSearch =
        !search ||
        [integrante.nombre, integrante.correo, integrante.area, integrante.cargo].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(search),
        );
      const matchesArea = accessAreaFilter === "todas" || integrante.area === accessAreaFilter;
      const matchesCargo = accessCargoFilter === "todos" || integrante.cargo === accessCargoFilter;
      const matchesType =
        accessTypeFilter === "todos" || integrante.tipo_integrante === accessTypeFilter;
      const matchesApp =
        accessAppFilter === "todas" ||
        accesos.some((acceso) => String(acceso.aplicacion_id) === String(accessAppFilter));
      const accessCount = accesos.length;
      const matchesAccessLevel =
        accessLevelFilter === "todos" ||
        (accessLevelFilter === "con-acceso" && accessCount > 0) ||
        (accessLevelFilter === "sin-acceso" && accessCount === 0) ||
        (accessLevelFilter.startsWith("cantidad-") &&
          accessCount === Number(accessLevelFilter.replace("cantidad-", "")));

      return (
        matchesSearch &&
        matchesArea &&
        matchesCargo &&
        matchesType &&
        matchesApp &&
        matchesAccessLevel
      );
    });
  }, [
    accessAppFilter,
    accessAreaFilter,
    accessCargoFilter,
    accessSearch,
    accessTypeFilter,
    accessLevelFilter,
    accesosPorIntegrante,
    voluntarios,
  ]);

  /* ================================================================
   * OPCIONES DE FILTROS
   * ================================================================ */

  const accessAreaOptions = useMemo(() => {
    return areas
      .map((area) => area.nombre)
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }, [areas]);

  const accessCargoOptions = useMemo(() => {
    const cargos = voluntarios
      .filter((integrante) => accessAreaFilter === "todas" || integrante.area === accessAreaFilter)
      .map((integrante) => integrante.cargo);

    return Array.from(new Set(cargos))
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }, [accessAreaFilter, voluntarios]);

  /* ================================================================
   * HANDLERS DE FILTROS
   * ================================================================ */

  const handleAccessAreaFilterChange = useCallback((value) => {
    setAccessAreaFilter(value);
    setAccessCargoFilter("todos");
    setNoAccessPage(1);
  }, []);

  const handleAccessSearchChange = useCallback((value) => {
    setAccessSearch(value);
    setNoAccessPage(1);
  }, []);

  const handleAccessCargoChange = useCallback((value) => {
    setAccessCargoFilter(value);
    setNoAccessPage(1);
  }, []);

  const handleAccessTypeChange = useCallback((value) => {
    setAccessTypeFilter(value);
    setNoAccessPage(1);
  }, []);

  const handleAccessAppChange = useCallback((value) => {
    setAccessAppFilter(value);
    setNoAccessPage(1);
  }, []);

  const handleAccessLevelChange = useCallback((value) => {
    setAccessLevelFilter(value);
    setNoAccessPage(1);
  }, []);

  const handleNoAccessPageChange = useCallback((page) => {
    setNoAccessPage(page);
  }, []);

  /* ================================================================
   * HANDLERS DE FORMULARIO DE ASIGNACIÓN
   * ================================================================ */

  const resetAssignForm = useCallback(() => {
    setSelectedVoluntarioId("");
    setVoluntarioSearch("");
    setSelectedAplicacionId("");
    setSelectedAplicacionIds([]);
  }, []);

  const handleSelectVoluntario = useCallback((voluntario) => {
    setSelectedVoluntarioId(String(voluntario.historial_id));
    setVoluntarioSearch(voluntario.nombre);
    setSelectedAplicacionId("");
    setSelectedAplicacionIds([]);
  }, []);

  const handleOpenAssignDialog = useCallback(
    (voluntario) => {
      resetAssignForm();
      setSelectedVoluntarioId(String(voluntario.historial_id));
      setVoluntarioSearch(voluntario.nombre);
      setAssignDialogOpen(true);
    },
    [resetAssignForm],
  );

  const handleVoluntarioSearchChange = useCallback((value) => {
    setVoluntarioSearch(value);
    setSelectedVoluntarioId("");
    setSelectedAplicacionId("");
    setSelectedAplicacionIds([]);
  }, []);

  const toggleAplicacionSelection = useCallback((aplicacionId) => {
    setSelectedAplicacionIds((current) =>
      current.includes(aplicacionId)
        ? current.filter((id) => id !== aplicacionId)
        : [...current, aplicacionId],
    );
  }, []);

  /* ================================================================
   * ASIGNAR ACCESO
   * ================================================================ */

  const handleAssign = useCallback(
    async (event) => {
      event.preventDefault();

      if (!canAssignAccesses) return;

      setSaving(true);
      setFeedback(null);

      try {
        const aplicacionesParaAsignar = selectedAplicacionIds.length
          ? selectedAplicacionIds
          : [selectedAplicacionId];

        const asignacionesCreadas = await Promise.all(
          aplicacionesParaAsignar.map((aplicacionId) =>
            assignAplicacionToVoluntario(aplicacionId, selectedVoluntarioId, profile),
          ),
        );

        setAsignaciones((current) => {
          const assignmentsById = new Map(current.map((asignacion) => [asignacion.id, asignacion]));
          asignacionesCreadas.filter(Boolean).forEach((asignacion) => {
            assignmentsById.set(asignacion.id, asignacion);
          });
          return Array.from(assignmentsById.values());
        });
        setNoAccessPage(1);
        resetAssignForm();
        setAssignDialogOpen(false);

        setFeedback({
          type: "success",
          message:
            aplicacionesParaAsignar.length > 1
              ? "Accesos asignados correctamente."
              : "Acceso asignado correctamente.",
        });

        void loadData();
      } catch (assignError) {
        setFeedback({
          type: "error",
          message: assignError.message || "No se pudo asignar el acceso.",
        });
      } finally {
        setSaving(false);
      }
    },
    [
      canAssignAccesses,
      selectedAplicacionId,
      selectedAplicacionIds,
      selectedVoluntarioId,
      profile,
      loadData,
      resetAssignForm,
    ],
  );

  const handleRequestRevoke = useCallback((asignacion) => {
    setRevokeTargets([asignacion]);
    setRevokeAll(false);
    setConfirmOpen(true);
  }, []);

  const handleRequestRevokeAll = useCallback(() => {
    if (!selectedAsignaciones.length) return;
    setRevokeTargets(selectedAsignaciones);
    setRevokeAll(true);
    setConfirmOpen(true);
  }, [selectedAsignaciones]);

  const handleConfirmOpenChange = useCallback(
    (open) => {
      if (saving) return;
      setConfirmOpen(open);
      if (!open) {
        setRevokeTargets([]);
        setRevokeAll(false);
      }
    },
    [saving],
  );

  const handleConfirmRevoke = useCallback(async () => {
    if (!canRevokeAccesses || revokeTargets.length === 0) return;

    setSaving(true);
    setFeedback(null);

    try {
      await Promise.all(
        revokeTargets.map((asignacion) => revokeAplicacionFromVoluntario(asignacion.id, profile)),
      );

      const revokedIds = new Set(revokeTargets.map((asignacion) => asignacion.id));
      setAsignaciones((current) => current.filter((asignacion) => !revokedIds.has(asignacion.id)));
      setConfirmOpen(false);
      setRevokeTargets([]);
      setRevokeAll(false);
      setFeedback({
        type: "success",
        message: revokeAll
          ? "Todos los accesos fueron retirados correctamente."
          : "Acceso retirado correctamente.",
      });

      void loadData();
    } catch (revokeError) {
      setFeedback({
        type: "error",
        message: revokeError.message || "No se pudieron retirar los accesos.",
      });
      setConfirmOpen(false);
      setRevokeTargets([]);
      setRevokeAll(false);
      void loadData();
    } finally {
      setSaving(false);
    }
  }, [canRevokeAccesses, loadData, profile, revokeAll, revokeTargets]);

  const handleDownload = useCallback(() => {
    downloadExcel(
      {
        headers: ["Integrante", "Correo", "Tipo", "Área", "Cargo", "Accesos"],
        data: integrantesFiltrados.map((integrante) => {
          const accesos = accesosPorIntegrante.get(String(integrante.historial_id)) || [];
          return [
            integrante.nombre,
            integrante.correo,
            getTipoLabel(integrante.tipo_integrante),
            integrante.area,
            integrante.cargo,
            accesos
              .map((acceso) => acceso.aplicacion?.nombre)
              .filter(Boolean)
              .join(", ") || "Sin acceso",
          ];
        }),
      },
      "integrantes_y_accesos.xls",
    );
  }, [accesosPorIntegrante, integrantesFiltrados]);

  const lastSearchRef = useRef(accessSearch);
  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const filters = {
      search: accessSearch,
      areaFilter: accessAreaFilter,
      cargoFilter: accessCargoFilter,
      typeFilter: accessTypeFilter,
      appFilter: accessAppFilter,
      accessLevelFilter,
    };

    const { search: currentSearch, ...dropdowns } = filters;
    const dropdownKey = JSON.stringify(dropdowns);

    const searchChanged = currentSearch !== lastSearchRef.current;
    const dropdownsChanged = dropdownKey !== dropdownFiltersRef.current;

    if (!searchChanged && !dropdownsChanged) return;

    lastSearchRef.current = currentSearch;
    if (dropdownsChanged) dropdownFiltersRef.current = dropdownKey;

    const isSearchOnly = searchChanged && !dropdownsChanged;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => {
        writeFiltersToUrl(filters, { replace: isSearchOnly });
      },
      isSearchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [
    accessSearch,
    accessAreaFilter,
    accessCargoFilter,
    accessTypeFilter,
    accessAppFilter,
    accessLevelFilter,
    writeFiltersToUrl,
  ]);

  return (
    <>
      <style>{`
        @keyframes accesosPageEnter {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes accesosSwitchEnter {
          0% { opacity: 0; transform: translateY(8px) scale(0.995); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .accesos-page-enter {
          animation: accesosPageEnter 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .accesos-switch-enter {
          animation: accesosSwitchEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .accesos-toggle-enter {
          animation: accesosSwitchEnter 380ms cubic-bezier(0.22, 1, 0.36, 1) 160ms both;
        }
        .accesos-initial-data * {
          animation: none !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .accesos-page-enter, .accesos-switch-enter, .accesos-toggle-enter { animation: none; }
        }
      `}</style>

      <div className="accesos-page-enter pb-6">
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          {canViewMetrics && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate("/accesos/metricas", {
                  state: { listSearch: location.search },
                })
              }
              className="h-10 gap-2 rounded-xl border-blue-200 bg-white px-4 text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800"
            >
              <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
              Métricas
            </Button>
          )}
          <ManualButton to="/accesos/manual" state={{ listSearch: location.search }} />
        </div>

        <AccesosFeedback feedback={feedback} onClose={() => setFeedback(null)} />

        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
              !
            </div>
            <span>{error}</span>
          </div>
        )}

        {loading || (aplicacionesLoading && aplicaciones.length === 0) ? (
          <>
            <AccesosStats stats={[]} loading />
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
              <p className="text-sm font-medium text-slate-700">Cargando accesos...</p>
            </section>
          </>
        ) : (
          <div className="accesos-initial-data">
            <AccesosStats stats={statsByApp} />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              {canDownloadExcel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  disabled={loading || integrantesFiltrados.length === 0}
                  className="h-10 gap-2 rounded-xl"
                >
                  <ExcelIcon className="h-4 w-4" /> Descargar Excel
                </Button>
              )}
              {canViewInactive && (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/accesos/inactivos", { state: { listSearch: location.search } })
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <ShieldAlert className="h-4 w-4" /> Integrantes inactivos con acceso
                  {asignacionesInactivas.length > 0 && (
                    <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold">
                      {asignacionesInactivas.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="accesos-switch-enter mt-5">
              <VoluntariosSinAccesoTable
                voluntarios={integrantesFiltrados}
                accesosPorIntegrante={accesosPorIntegrante}
                canManage={canManageAccesses}
                aplicaciones={aplicaciones}
                accessSearch={accessSearch}
                accessAreaFilter={accessAreaFilter}
                accessCargoFilter={accessCargoFilter}
                accessTypeFilter={accessTypeFilter}
                accessAppFilter={accessAppFilter}
                accessLevelFilter={accessLevelFilter}
                accessAreaOptions={accessAreaOptions}
                accessCargoOptions={accessCargoOptions}
                currentPage={noAccessPage}
                pageSize={PAGE_SIZE}
                onSearchChange={handleAccessSearchChange}
                onAreaChange={handleAccessAreaFilterChange}
                onCargoChange={handleAccessCargoChange}
                onTypeChange={handleAccessTypeChange}
                onAppChange={handleAccessAppChange}
                onAccessLevelChange={handleAccessLevelChange}
                onPageChange={handleNoAccessPageChange}
                onManageAccesses={handleOpenAssignDialog}
              />
            </div>
          </div>
        )}

        {canManageAccesses && (
          <AccesoAssignDialog
            open={assignDialogOpen}
            onOpenChange={(open) => {
              setAssignDialogOpen(open);
              if (!open) resetAssignForm();
            }}
            selectedVoluntario={selectedVoluntario}
            selectedVoluntarioId={selectedVoluntarioId}
            voluntarioSearch={voluntarioSearch}
            filteredVoluntarios={filteredVoluntarios}
            aplicacionesDisponibles={aplicacionesDisponibles}
            asignacionesActuales={selectedAsignaciones}
            statsMap={statsMap}
            selectedAplicacionIds={selectedAplicacionIds}
            saving={saving}
            canAssign={canAssignAccesses}
            canRevoke={canRevokeAccesses}
            onSubmit={handleAssign}
            onVoluntarioSearchChange={handleVoluntarioSearchChange}
            onSelectVoluntario={handleSelectVoluntario}
            onToggleAplicacion={toggleAplicacionSelection}
            onRequestRevoke={handleRequestRevoke}
            onRequestRevokeAll={handleRequestRevokeAll}
          />
        )}

        {canRevokeAccesses && (
          <AccesoConfirmDialog
            open={confirmOpen}
            asignaciones={revokeTargets}
            removeAll={revokeAll}
            loading={saving}
            onOpenChange={handleConfirmOpenChange}
            onConfirm={handleConfirmRevoke}
          />
        )}
      </div>
    </>
  );
}

export default Accesos;
