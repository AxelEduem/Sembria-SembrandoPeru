import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";

import AreaConfirmDialog from "@/components/areas/AreaConfirmDialog";
import AreaFeedback from "@/components/areas/AreaFeedback";
import AreasFilters from "@/components/areas/AreasFilters";
import AreaFormDialog from "@/components/areas/AreaFormDialog";
import AreasTable from "@/components/areas/AreasTable";

import { useAreas } from "@/hooks/useAreas";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";

/* ------------------------------------------------------------------ */
/*  Sincronización de filtros con la URL                               */
/* ------------------------------------------------------------------ */

const AREAS_PARAM_MAP = {
  search: "q",
  statusFilter: "estado",
  dateFilter: "fecha",
};

const AREAS_DEFAULTS = {
  search: "",
  statusFilter: "todas",
  dateFilter: "",
};

function Areas() {
  const { profile } = useAuth();

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: AREAS_PARAM_MAP,
    defaults: AREAS_DEFAULTS,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  const canCreate = hasPermission(profile, PERMISSIONS.AREAS_CREAR);
  const canEdit = hasPermission(profile, PERMISSIONS.AREAS_EDITAR);
  const canToggle = hasPermission(profile, PERMISSIONS.AREAS_DESACTIVAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.AREAS_DESCARGAR_EXCEL);

  const {
    areas,
    filteredAreas,
    loading,
    error,
    feedback,
    search,
    statusFilter,
    dateFilter,
    saving,
    hasFilters,
    statusOptions,
    setSearch,
    setStatusFilter,
    setDateFilter,
    setFeedback,
    createArea,
    updateArea,
    setAreaActive,
  } = useAreas({ initialFilters });

  const [formOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [areaToToggle, setAreaToToggle] = useState(null);

  const emptyMessage = useMemo(() => {
    if (!areas.length) {
      return "Aun no existen areas registradas.";
    }

    if (hasFilters) {
      return "No encontramos areas que coincidan con tu busqueda.";
    }

    return "Aun no existen areas registradas.";
  }, [areas.length, hasFilters]);

  const openCreateDialog = useCallback(() => {
    if (!canCreate) {
      return;
    }

    setEditingArea(null);
    setFormOpen(true);
  }, [canCreate]);

  const openEditDialog = useCallback(
    (area) => {
      if (!canEdit) {
        return;
      }

      setEditingArea(area);
      setFormOpen(true);
    },
    [canEdit],
  );

  const openToggleDialog = useCallback(
    (area) => {
      if (!canToggle) {
        return;
      }

      setAreaToToggle(area);
      setConfirmOpen(true);
    },
    [canToggle],
  );

  const handleFormOpenChange = useCallback(
    (value) => {
      if (saving) {
        return;
      }

      setFormOpen(value);

      if (!value) {
        setEditingArea(null);
      }
    },
    [saving],
  );

  const handleConfirmOpenChange = useCallback(
    (value) => {
      if (saving) {
        return;
      }

      setConfirmOpen(value);

      if (!value) {
        setAreaToToggle(null);
      }
    },
    [saving],
  );

  const handleDownloadExcel = useCallback(() => {
    if (!canDownloadExcel) {
      return;
    }

    downloadExcel(
      {
        headers: ["Nombre", "Descripcion", "Estado", "Creacion"],
        data: filteredAreas.map((area) => [
          area.nombre,
          area.descripcion || "",
          area.activo ? "Activo" : "Inactivo",
          formatExcelDate(area.created_at),
        ]),
      },
      "areas.xls",
    );
  }, [canDownloadExcel, filteredAreas]);

  const handleFormSubmit = useCallback(
    async (input) => {
      if (editingArea) {
        if (!canEdit) {
          return { success: false, message: "No tienes permisos para editar areas." };
        }

        return updateArea(editingArea.id, input);
      }

      if (!canCreate) {
        return { success: false, message: "No tienes permisos para registrar areas." };
      }

      return createArea(input);
    },
    [canCreate, canEdit, createArea, editingArea, updateArea],
  );

  const handleToggleArea = useCallback(async () => {
    if (!areaToToggle || !canToggle) {
      return;
    }

    const result = await setAreaActive(areaToToggle.id, !areaToToggle.activo);

    if (result.success) {
      setConfirmOpen(false);
      setAreaToToggle(null);
    }
  }, [areaToToggle, canToggle, setAreaActive]);

  /* ---- Sync todos los filtros → URL (único efecto) ---- */

  const lastSearchRef = useRef(search);
  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const filters = {
      search,
      statusFilter,
      dateFilter,
    };

    const { search: currentSearch, ...dropdowns } = filters;
    const dropdownKey = JSON.stringify(dropdowns);

    const searchChanged = currentSearch !== lastSearchRef.current;
    const dropdownsChanged = dropdownKey !== dropdownFiltersRef.current;

    // Nada cambió → no hacer nada
    if (!searchChanged && !dropdownsChanged) return;

    lastSearchRef.current = currentSearch;
    if (dropdownsChanged) dropdownFiltersRef.current = dropdownKey;

    const isSearchOnly = searchChanged && !dropdownsChanged;

    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(
      () => {
        // Siempre pasamos TODOS los filtros, nunca solo uno
        writeFiltersToUrl(filters, { replace: isSearchOnly });
      },
      isSearchOnly ? 300 : 0,
    );

    return () => clearTimeout(searchTimerRef.current);
  }, [search, statusFilter, dateFilter, writeFiltersToUrl]);

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

          {canCreate && (
            <Button
              type="button"
              onClick={openCreateDialog}
              className="h-10 w-full shrink-0 gap-2 rounded-xl bg-[#2D5A3D] px-4 text-white shadow-sm shadow-emerald-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#234B32] hover:shadow-md sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva area
            </Button>
          )}
        </div>
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <AreasFilters
          search={search}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          statusOptions={statusOptions}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onDateFilterChange={setDateFilter}
        />
      </div>

      <AreaFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
            !
          </div>

          <span>{error}</span>
        </div>
      )}

      <div className="module-section-enter module-enter-delay-3">
        <AreasTable
          key={`${search}-${statusFilter}-${dateFilter}`}
          areas={loading ? [] : filteredAreas}
          canEdit={canEdit}
          canToggle={canToggle}
          emptyMessage={emptyMessage}
          loading={loading}
          onEdit={openEditDialog}
          onToggleActive={openToggleDialog}
        />
      </div>

      {(canCreate || canEdit || canToggle) && (
        <>
          {formOpen && ((editingArea && canEdit) || (!editingArea && canCreate)) && (
            <AreaFormDialog
              key={editingArea?.id || "new-area"}
              open={formOpen}
              area={editingArea}
              loading={saving}
              onOpenChange={handleFormOpenChange}
              onSubmit={handleFormSubmit}
            />
          )}

          {canToggle && (
            <AreaConfirmDialog
              open={confirmOpen}
              area={areaToToggle}
              action={areaToToggle?.activo ? "deactivate" : "activate"}
              loading={saving}
              onOpenChange={handleConfirmOpenChange}
              onConfirm={handleToggleArea}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Areas;
