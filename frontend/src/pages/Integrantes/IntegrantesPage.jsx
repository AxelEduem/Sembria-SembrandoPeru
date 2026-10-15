import { useState, useEffect } from "react";
import { BarChart3, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";

import IntegrantesFilters from "@/components/integrantes/IntegrantesFilters";
import IntegrantesTable from "@/components/integrantes/IntegrantesTable";
import IntegranteDeactivateModal from "@/components/integrantes/IntegranteDeactivateModal";

import { IntegrantesProvider, useIntegrantesContext } from "@/contexts/IntegrantesContext";
import { useAuth } from "@/contexts/AuthContext";

import { downloadExcel, formatExcelDate } from "@/utils/excelExport";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";
import { exportIntegrantes } from "@/services/integrantes/integrantesService";

function getRows(rows) {
  return {
    headers: [
      "ID",
      "Nombres",
      "Apellidos",
      "Correo",
      "Fecha nacimiento",
      "Tipo de documento",
      "Documento de identidad",
      "Teléfono",
      "Departamento",
      "Ciudad",
      "Distrito",
      "Tipo de integrante",
      "Cargo",
      "Área",
      "Rol",
      "Modalidad",
      "Institución educativa",
      "Carrera",
      "Ciclo",
      "Horas de prácticas requeridas",
      "Periodo (meses)",
      "Fecha inicio",
      "Fecha fin",
      "Estado",
      "Fecha de creación",
    ],
    data: rows.map((row) => [
      row.id,
      row.nombres,
      row.apellidos,
      row.correo || "",
      formatExcelDate(row.fecha_nacimiento),
      row.tipo_documento || "",
      row.documento_identidad || "",
      row.telefono || "",
      row.departamento || "",
      row.ciudad || "",
      row.distrito || "",
      row.tipo_integrante || "",
      row.cargo,
      row.area,
      row.rol_nombre || "",
      row.modalidad || "",
      row.institucion_educativa || "",
      row.carrera || "",
      row.ciclo || "",
      row.horas_practicas_requeridas ?? "",
      row.periodo_meses ?? "",
      formatExcelDate(row.fecha_inicio),
      formatExcelDate(row.fecha_fin),
      row.estado,
      formatExcelDate(row.created_at),
    ]),
  };
}

function IntegrantesPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const canCreate = hasPermission(profile, PERMISSIONS.INTEGRANTES_CREAR);
  const canViewDetail = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_DETALLE);
  const canEdit = hasPermission(profile, PERMISSIONS.INTEGRANTES_EDITAR);
  const canDeactivate = hasPermission(profile, PERMISSIONS.INTEGRANTES_DESACTIVAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.INTEGRANTES_DESCARGAR_EXCEL);
  const canViewMetrics = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_METRICAS);
  const canViewHistory = hasPermission(profile, PERMISSIONS.INTEGRANTES_VER_HISTORIAL);
  const canRehire = hasPermission(profile, PERMISSIONS.INTEGRANTES_RECONTRATAR);
  const canActivate = hasPermission(profile, PERMISSIONS.INTEGRANTES_ACTIVAR);

  const {
    filteredIntegrantes,
    loading,
    error,
    feedback,
    setFeedback,
    clearError,
    deactivateIntegrante,
    restoreIntegrante,
    integrantes,
    hasFilters,
    page,
    pagination,
    setPage,
    exportFilters,
  } = useIntegrantesContext();

  const [confirm, setConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const routeFeedback = location.state?.feedback;

    if (!routeFeedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback(routeFeedback);

      navigate(location.pathname, {
        replace: true,
        state: location.state?.listSearch ? { listSearch: location.state.listSearch } : {},
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location, navigate, setFeedback]);

  async function downloadCurrent() {
    if (exporting || loading || !pagination.total) {
      return;
    }

    setExporting(true);

    try {
      const rows = await exportIntegrantes(exportFilters);
      await downloadExcel(getRows(rows), "integrantes.xlsx");
    } finally {
      setExporting(false);
    }
  }

  async function confirmAction() {
    if (!confirm) return;

    if (confirm.action === "deactivate") {
      const result = await deactivateIntegrante(confirm.row.id, confirm.reason);
      if (result?.success) {
        setConfirm(null);
      }
      return result;
    }

    if (confirm.action === "restore") {
      const result = await restoreIntegrante(confirm.row.id);
      if (result?.success) {
        setConfirm(null);
      }
      return result;
    }

    return {
      success: false,
      message: "Acción no reconocida.",
    };
  }

  function handleView(row) {
    navigate(`/integrantes/${row.id}`, { state: { listSearch: location.search } });
  }

  function handleViewHistory(row) {
    navigate(`/integrantes/${row.id}/historial`, {
      state: { listSearch: location.search },
    });
  }

  function handleEdit(row) {
    navigate(`/integrantes/${row.id}/editar`, { state: { listSearch: location.search } });
  }

  function handleDeactivate(row) {
    setConfirm({
      action: "deactivate",
      row,
      reason: "",
    });
  }

  function handleRestore(row) {
    setConfirm({
      action: "restore",
      row,
      reason: "",
    });
  }

  function handleRehire(row) {
    navigate(`/integrantes/${row.id}/recontratar`, { state: { listSearch: location.search } });
  }

  const label = "integrantes";
  const singular = "integrante";

  return (
    <div className="module-page-enter pb-6">
      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap justify-end gap-2">
        {canViewMetrics && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate("/integrantes/metricas", { state: { listSearch: location.search } })
            }
            className="h-10 gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            Métricas
          </Button>
        )}

        {canDownloadExcel && (
          <Button
            type="button"
            variant="outline"
            onClick={downloadCurrent}
            disabled={exporting || loading || !pagination.total}
            className="h-10 gap-2 rounded-xl"
          >
            <ExcelIcon className="h-4 w-4" />
            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        )}

        <ManualButton to="/integrantes/manual" state={{ listSearch: location.search }} />

        {canCreate && (
          <Button
            type="button"
            onClick={() => navigate("/integrantes/nuevo", { state: { listSearch: location.search } })}
            className="h-10 gap-2 rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
          >
            <Plus className="h-4 w-4" />
            Nuevo {singular}
          </Button>
        )}
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <IntegrantesFilters />
      </div>

      <FeedbackToast
        feedback={feedback || (error ? { type: "error", message: error } : null)}
        onClose={() => {
          setFeedback(null);
          clearError();
        }}
      />

      {loading ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-700">Cargando {label}</p>
        </section>
      ) : (
        <div className="module-section-enter module-enter-delay-3">
          <IntegrantesTable
            rows={filteredIntegrantes}
            emptyMessage={
              integrantes.length && hasFilters
                ? `No encontramos ${label} que coincidan con tu búsqueda.`
                : `Aún no existen ${label} registrados.`
            }
            onView={handleView}
            onViewHistory={handleViewHistory}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
            onRestore={handleRestore}
            onRehire={handleRehire}
            canView={canViewDetail}
            canViewHistory={canViewHistory}
            canEdit={canEdit}
            canDeactivate={canDeactivate}
            canActivate={canActivate}
            canRehire={canRehire}
            currentPage={page}
            totalPages={pagination.lastPage}
            totalItems={pagination.total}
            pageSize={pagination.perPage}
            startRow={pagination.from}
            endRow={pagination.to}
            onPageChange={setPage}
          />
        </div>
      )}

      <IntegranteDeactivateModal
        confirm={confirm}
        onClose={() => setConfirm(null)}
        onConfirm={confirmAction}
        onReasonChange={(reason) =>
          setConfirm((current) =>
            current
              ? {
                  ...current,
                  reason,
                }
              : current,
          )
        }
      />
    </div>
  );
}

export default function IntegrantesPage() {
  return (
    <IntegrantesProvider>
      <IntegrantesPageContent />
    </IntegrantesProvider>
  );
}
