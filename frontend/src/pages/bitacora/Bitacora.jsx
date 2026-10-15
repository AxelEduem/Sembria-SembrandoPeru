import { useCallback, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import BitacoraDetailDialog from "@/components/bitacora/BitacoraDetailDialog";
import BitacoraFilters from "@/components/bitacora/BitacoraFilters";
import BitacoraTable from "@/components/bitacora/BitacoraTable";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import { useAuth } from "@/contexts/AuthContext";
import useBitacora from "@/hooks/useBitacora";
import { exportBitacora } from "@/services/bitacora/bitacoraService";
import { downloadExcel } from "@/utils/excelExport";
import { PERMISSIONS, getPermissionScopeKey, hasPermission } from "@/utils/permissions";

const DEFAULT_FILTERS = {
  q: "",
  modulo: "todos",
  accion: "todos",
  resultado: "todos",
  desde: "",
  hasta: "",
  page: 1,
  per_page: 20,
};

function exportRows(records) {
  return {
    headers: [
      "Fecha",
      "Usuario",
      "Correo",
      "Área",
      "Módulo",
      "Acción",
      "Descripción",
      "Entidad",
      "Resultado",
      "Método",
      "Ruta",
      "HTTP",
      "IP",
      "Campos",
    ],
    data: records.map((record) => [
      record.fecha
        ? new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "medium" }).format(
            new Date(record.fecha),
          )
        : "",
      record.actor?.nombre || "",
      record.actor?.correo || "",
      record.actor?.area || "",
      record.modulo || "",
      record.accion || "",
      record.descripcion || "",
      record.entidad?.tipo
        ? `${record.entidad.nombre || record.entidad.tipo}${record.entidad.id ? ` (ID #${record.entidad.id})` : ""}`
        : "",
      record.resultado || "",
      record.solicitud?.metodo || "",
      record.solicitud?.ruta || "",
      record.solicitud?.estado_http || "",
      record.solicitud?.ip || "",
      (record.campos_modificados || []).join(", "),
    ]),
  };
}

export default function Bitacora() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [exporting, setExporting] = useState(false);
  const requestFilters = useMemo(() => filters, [filters]);
  const cacheScope = useMemo(() => {
    const account = profile?.cuenta_acceso_id || profile?.id || "anon";
    return `${account}:${getPermissionScopeKey(profile, PERMISSIONS.BITACORA_VER)}`;
  }, [profile]);
  const { records, catalogs, meta, loading, error, refresh } = useBitacora(requestFilters, {
    cacheScope,
  });
  const canExport = hasPermission(profile, PERMISSIONS.BITACORA_DESCARGAR_EXCEL);
  const canViewMetrics = hasPermission(profile, PERMISSIONS.BITACORA_VER_METRICAS);

  const changeFilter = useCallback((key, value) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }, []);

  const handleExport = useCallback(async () => {
    if (!canExport || exporting) return;
    setExporting(true);
    try {
      const response = await exportBitacora({ ...filters, page: undefined, per_page: undefined });
      await downloadExcel(
        exportRows(response?.data || []),
        `bitacora-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      setFeedback({
        type: "success",
        message: `Se exportaron ${response?.data?.length || 0} eventos.`,
      });
      if (response?.meta?.truncated)
        setFeedback({
          type: "warning",
          message: `El archivo contiene el máximo de ${response.meta.limit} eventos. Aplica filtros para acotar el reporte.`,
        });
    } catch (exportError) {
      setFeedback({
        type: "error",
        message: exportError?.message || "No se pudo descargar el Excel.",
      });
    } finally {
      setExporting(false);
    }
  }, [canExport, exporting, filters]);

  return (
    <div className="module-page-enter pb-6">
      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap justify-end gap-2">
        {canViewMetrics && (
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate("/bitacora/metricas", { state: { listSearch: location.search } })
            }
            className="h-10 gap-2 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            Métricas
          </Button>
        )}
        {canExport && (
          <Button
            type="button"
            variant="outline"
            onClick={handleExport}
            disabled={exporting || loading || !records.length}
            className="h-10 gap-2 rounded-xl"
          >
            <ExcelIcon className="h-4 w-4" />
            {exporting ? "Exportando..." : "Descargar Excel"}
          </Button>
        )}
        <ManualButton to="/bitacora/manual" state={{ listSearch: location.search }} />
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <BitacoraFilters
          filters={filters}
          catalogs={catalogs}
          onChange={changeFilter}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </div>
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <Button type="button" variant="ghost" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      )}
      {loading ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm font-medium text-slate-700">Cargando eventos</p>
        </section>
      ) : (
        <div className="module-section-enter module-enter-delay-3">
          <BitacoraTable
            records={records}
            meta={meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            onView={setSelectedRecord}
          />
        </div>
      )}
      <BitacoraDetailDialog
        record={selectedRecord}
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
      />
    </div>
  );
}
