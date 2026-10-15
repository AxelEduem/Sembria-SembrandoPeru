import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Plus } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import ManualButton from "@/components/ui/ManualButton";

import AplicacionConfirmDialog from "@/components/aplicaciones/AplicacionConfirmDialog";
import AplicacionFeedback from "@/components/aplicaciones/AplicacionFeedback";
import AplicacionFormDialog from "@/components/aplicaciones/AplicacionFormDialog";
import AplicacionesFilters from "@/components/aplicaciones/AplicacionesFilters";
import AplicacionesTable from "@/components/aplicaciones/AplicacionesTable";

import { useAplicaciones } from "@/hooks/useAplicaciones";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { useAreas } from "@/hooks/useAreas";
import { useAuth } from "@/contexts/AuthContext";

import { PERMISSIONS, hasPermission } from "@/utils/permissions";

import { downloadExcel, formatExcelDate } from "@/utils/excelExport";

const APLICACIONES_PARAM_MAP = {
  search: "q",
  areaFilter: "area",
  statusFilter: "status",
  dateFilter: "fecha",
};

const APLICACIONES_DEFAULTS = {
  search: "",
  areaFilter: "todas",
  statusFilter: "todos",
  dateFilter: "",
};

function Aplicaciones() {
  const { profile } = useAuth();
  const location = useLocation();

  const canManageCreate = hasPermission(profile, PERMISSIONS.APLICACIONES_CREAR);

  const canManageEdit = hasPermission(profile, PERMISSIONS.APLICACIONES_EDITAR);

  const canManageDeactivate = hasPermission(profile, PERMISSIONS.APLICACIONES_DESACTIVAR);

  const canDownloadExcel = hasPermission(profile, PERMISSIONS.APLICACIONES_DESCARGAR_EXCEL);

  const { areas } = useAreas();

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: APLICACIONES_PARAM_MAP,
    defaults: APLICACIONES_DEFAULTS,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  const {
    aplicaciones,
    filteredAplicaciones,
    loading,
    saving,
    error,
    feedback,
    search,
    areaFilter,
    statusFilter,
    dateFilter,
    statusOptions,
    hasFilters,
    setSearch,
    setAreaFilter,
    setStatusFilter,
    setDateFilter,
    setFeedback,
    createAplicacion,
    updateAplicacion,
    deactivateAplicacion,
    activateAplicacion,
  } = useAplicaciones(initialFilters);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAplicacion, setEditingAplicacion] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [aplicacionToChange, setAplicacionToChange] = useState(null);

  const [confirmAction, setConfirmAction] = useState("deactivate");
  const filtersInitializedRef = useRef(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (!filtersInitializedRef.current) {
      filtersInitializedRef.current = true;
      return;
    }

    writeFiltersToUrl({
      search,
      areaFilter,
      statusFilter,
      dateFilter,
    });
  }, [profile, search, areaFilter, statusFilter, dateFilter, writeFiltersToUrl]);

  const emptyMessage =
    aplicaciones.length === 0
      ? "Aún no existen aplicaciones registradas."
      : hasFilters
        ? "No encontramos aplicaciones con esos filtros."
        : "Aún no existen aplicaciones registradas.";

  const openCreateDialog = useCallback(() => {
    if (!canManageCreate) {
      return;
    }

    setEditingAplicacion(null);
    setFormOpen(true);
  }, [canManageCreate]);

  const openEditDialog = useCallback(
    (aplicacion) => {
      if (!canManageEdit) {
        return;
      }

      setEditingAplicacion(aplicacion);
      setFormOpen(true);
    },
    [canManageEdit],
  );

  const openDeactivateDialog = useCallback(
    (aplicacion) => {
      if (!canManageDeactivate) {
        return;
      }

      setAplicacionToChange(aplicacion);
      setConfirmAction("deactivate");
      setConfirmOpen(true);
    },
    [canManageDeactivate],
  );

  const openActivateDialog = useCallback(
    (aplicacion) => {
      if (!canManageDeactivate) {
        return;
      }

      setAplicacionToChange(aplicacion);
      setConfirmAction("activate");
      setConfirmOpen(true);
    },
    [canManageDeactivate],
  );

  const handleFormSubmit = useCallback(
    async (input) => {
      if (editingAplicacion) {
        if (!canManageEdit) {
          return {
            success: false,
            message: "No tienes permisos para editar aplicaciones.",
          };
        }

        return updateAplicacion(editingAplicacion.id, input);
      }

      if (!canManageCreate) {
        return {
          success: false,
          message: "No tienes permisos para crear aplicaciones.",
        };
      }

      return createAplicacion(input);
    },
    [editingAplicacion, canManageEdit, canManageCreate, updateAplicacion, createAplicacion],
  );

  const handleConfirmChange = useCallback(async () => {
    if (!aplicacionToChange || !canManageDeactivate) {
      return;
    }

    const result =
      confirmAction === "deactivate"
        ? await deactivateAplicacion(aplicacionToChange.id)
        : await activateAplicacion(aplicacionToChange.id);

    if (result?.success) {
      setConfirmOpen(false);
      setAplicacionToChange(null);
    }
  }, [
    aplicacionToChange,
    canManageDeactivate,
    confirmAction,
    deactivateAplicacion,
    activateAplicacion,
  ]);

  const handleConfirmOpenChange = useCallback((value) => {
    setConfirmOpen(value);

    if (!value) {
      setAplicacionToChange(null);
      setConfirmAction("deactivate");
    }
  }, []);

  const handleFormOpenChange = useCallback((value) => {
    setFormOpen(value);

    if (!value) {
      setEditingAplicacion(null);
    }
  }, []);

  const handleDownloadExcel = useCallback(() => {
    downloadExcel(
      {
        headers: ["Aplicacion", "Descripcion", "Area", "Estado", "Licencias", "Foto", "Creacion"],
        data: filteredAplicaciones.map((aplicacion) => [
          aplicacion.nombre,
          aplicacion.descripcion || "",
          aplicacion.area_nombre || "",
          aplicacion.activo ? "Activo" : "Inactivo",
          aplicacion.licencias_total,
          aplicacion.imagen_url || "",
          formatExcelDate(aplicacion.created_at),
        ]),
      },
      "aplicaciones.xls",
    );
  }, [filteredAplicaciones]);

  return (
    <div className="module-page-enter pb-6">
      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <div className="flex flex-col gap-2 sm:flex-row">
          {canDownloadExcel && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadExcel}
              className="h-10 w-full shrink-0 gap-2 rounded-xl px-4 sm:w-auto"
            >
              <ExcelIcon className="h-4 w-4" />
              Descargar Excel
            </Button>
          )}

          <ManualButton
            to="/aplicaciones/manual"
            state={{ listSearch: location.search }}
            className="w-full shrink-0 sm:w-auto"
          />

          {canManageCreate && (
            <Button
              type="button"
              onClick={openCreateDialog}
              className="h-10 w-full shrink-0 gap-2 rounded-xl bg-[#2D5A3D] px-4 text-white shadow-sm shadow-emerald-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#234B32] hover:shadow-md sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva aplicación
            </Button>
          )}
        </div>
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <AplicacionesFilters
          search={search}
          areaFilter={areaFilter}
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          statusOptions={statusOptions}
          areas={areas}
          onSearchChange={setSearch}
          onAreaFilterChange={setAreaFilter}
          onDateFilterChange={setDateFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      <AplicacionFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
            !
          </div>

          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            </div>

            <p className="text-sm font-medium text-slate-700">Cargando aplicaciones</p>

            <p className="mt-1 text-xs text-slate-400">
              Estamos obteniendo la información de las aplicaciones.
            </p>
          </div>
        </section>
      ) : (
        <div className="module-section-enter module-enter-delay-3">
          <AplicacionesTable
            aplicaciones={filteredAplicaciones}
            areas={areas}
            profile={profile}
            canManageEdit={canManageEdit}
            canManageDeactivate={canManageDeactivate}
            emptyMessage={emptyMessage}
            onEdit={openEditDialog}
            onDeactivate={openDeactivateDialog}
            onActivate={openActivateDialog}
          />
        </div>
      )}

      {(canManageCreate || canManageEdit || canManageDeactivate) && (
        <>
          {formOpen && (canManageCreate || canManageEdit) && (
            <AplicacionFormDialog
              key={editingAplicacion?.id || "new-aplicacion"}
              open={formOpen}
              aplicacion={editingAplicacion}
              loading={saving}
              profile={profile}
              areas={areas}
              onOpenChange={handleFormOpenChange}
              onSubmit={handleFormSubmit}
            />
          )}

          <AplicacionConfirmDialog
            open={confirmOpen}
            aplicacion={aplicacionToChange}
            action={confirmAction}
            loading={saving}
            onOpenChange={handleConfirmOpenChange}
            onConfirm={handleConfirmChange}
          />
        </>
      )}
    </div>
  );
}

export default Aplicaciones;
