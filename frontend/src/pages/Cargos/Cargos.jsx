import { useEffect, useMemo, useRef, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";

import CargoConfirmDialog from "@/components/cargos/CargoConfirmDialog";
import CargoFeedback from "@/components/cargos/CargoFeedback";
import CargoFormDialog from "@/components/cargos/CargoFormDialog";
import CargosFilters from "@/components/cargos/CargosFilters";
import CargosTable from "@/components/cargos/CargosTable";

import { useAreas } from "@/hooks/useAreas";
import { CARGO_STATUS_OPTIONS, useCargos } from "@/hooks/useCargos";
import useUrlSyncedFilters from "@/hooks/useUrlSyncedFilters";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSIONS, hasPermission } from "@/utils/permissions";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";

/* ------------------------------------------------------------------ */
/*  Sincronización de filtros con la URL                               */
/* ------------------------------------------------------------------ */

const CARGOS_PARAM_MAP = {
  search: "q",
  areaFilter: "area",
  statusFilter: "estado",
  dateFilter: "fecha",
};

const CARGOS_DEFAULTS = {
  search: "",
  areaFilter: "todas",
  statusFilter: "todas",
  dateFilter: "",
};

function Cargos() {
  const { profile } = useAuth();

  const { readInitialFilters, writeFiltersToUrl } = useUrlSyncedFilters({
    paramMap: CARGOS_PARAM_MAP,
    defaults: CARGOS_DEFAULTS,
  });

  const initialFilters = useMemo(() => readInitialFilters(), [readInitialFilters]);

  const canCreate = hasPermission(profile, PERMISSIONS.CARGOS_CREAR);
  const canEdit = hasPermission(profile, PERMISSIONS.CARGOS_EDITAR);
  const canToggle = hasPermission(profile, PERMISSIONS.CARGOS_DESACTIVAR);
  const canDownloadExcel = hasPermission(profile, PERMISSIONS.CARGOS_DESCARGAR_EXCEL);

  const {
    cargos,
    filteredCargos,
    loading,
    error,
    feedback,
    search,
    areaFilter,
    dateFilter,
    statusFilter,
    saving,
    hasFilters,
    setSearch,
    setAreaFilter,
    setDateFilter,
    setStatusFilter,
    setFeedback,
    createCargo,
    updateCargo,
    setCargoActive,
  } = useCargos({ initialFilters });

  const { areas, loading: loadingAreas } = useAreas();
  const activeAreas = useMemo(() => areas.filter((area) => area.activo), [areas]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cargoToToggle, setCargoToToggle] = useState(null);

  const emptyMessage = useMemo(() => {
    if (!cargos.length) {
      return "Aun no existen cargos registrados.";
    }

    if (hasFilters) {
      return "No encontramos cargos que coincidan con tu busqueda.";
    }

    return "Aun no existen cargos registrados.";
  }, [cargos.length, hasFilters]);

  function openCreateDialog() {
    if (!canCreate) return;
    setEditingCargo(null);
    setFormOpen(true);
  }

  function openEditDialog(cargo) {
    if (!canEdit) return;
    setEditingCargo(cargo);
    setFormOpen(true);
  }

  function openToggleDialog(cargo) {
    if (!canToggle) return;
    setCargoToToggle(cargo);
    setConfirmOpen(true);
  }

  function handleFormOpenChange(value) {
    if (saving) return;
    setFormOpen(value);
    if (!value) setEditingCargo(null);
  }

  function handleConfirmOpenChange(value) {
    if (saving) return;
    setConfirmOpen(value);
    if (!value) setCargoToToggle(null);
  }

  function handleDownloadExcel() {
    if (!canDownloadExcel) return;

    downloadExcel(
      {
        headers: ["Cargo", "Area", "Rol", "Descripcion", "Estado", "Creacion"],
        data: filteredCargos.map((cargo) => [
          cargo.nombre,
          cargo.area,
          cargo.rol?.nombre || cargo.rol_nombre || "Sin rol asignado",
          cargo.descripcion || "",
          cargo.activo ? "Activo" : "Inactivo",
          formatExcelDate(cargo.created_at),
        ]),
      },
      "cargos.xls",
    );
  }

  async function handleFormSubmit(input) {
    if (editingCargo) {
      if (!canEdit) {
        return { success: false, message: "No tienes permisos para editar cargos." };
      }
      return updateCargo(editingCargo.id, input);
    }

    if (!canCreate) {
      return { success: false, message: "No tienes permisos para registrar cargos." };
    }

    return createCargo(input);
  }

  async function handleToggleCargo() {
    if (!cargoToToggle || !canToggle) return;

    const result = await setCargoActive(cargoToToggle.id, !cargoToToggle.activo);

    if (result.success) {
      setConfirmOpen(false);
      setCargoToToggle(null);
    }
  }

  /* ---- Sync todos los filtros → URL (único efecto) ---- */

  const lastSearchRef = useRef(search);
  const dropdownFiltersRef = useRef(null);
  const searchTimerRef = useRef(null);

  useEffect(() => {
    const filters = {
      search,
      areaFilter,
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
  }, [search, areaFilter, statusFilter, dateFilter, writeFiltersToUrl]);

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
              Nuevo cargo
            </Button>
          )}
        </div>
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <CargosFilters
          search={search}
          areaFilter={areaFilter}
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          statusOptions={CARGO_STATUS_OPTIONS}
          areas={activeAreas}
          onSearchChange={setSearch}
          onAreaFilterChange={setAreaFilter}
          onDateFilterChange={setDateFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>

      <CargoFeedback feedback={feedback} onClose={() => setFeedback(null)} />

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-100 font-semibold">
            !
          </div>
          <span>{error}</span>
        </div>
      )}

      <div className="module-section-enter module-enter-delay-3">
        <CargosTable
          key={`${search}-${areaFilter}-${dateFilter}-${statusFilter}`}
          cargos={loading ? [] : filteredCargos}
          canManage={canEdit || canToggle}
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
          {formOpen && ((editingCargo && canEdit) || (!editingCargo && canCreate)) && (
            <CargoFormDialog
              key={editingCargo?.id || "new-cargo"}
              open={formOpen}
              cargo={editingCargo}
              areas={activeAreas}
              loading={saving}
              loadingAreas={loadingAreas}
              onOpenChange={handleFormOpenChange}
              onSubmit={handleFormSubmit}
            />
          )}

          {canToggle && (
            <CargoConfirmDialog
              open={confirmOpen}
              cargo={cargoToToggle}
              action={cargoToToggle?.activo ? "deactivate" : "activate"}
              loading={saving}
              onOpenChange={handleConfirmOpenChange}
              onConfirm={handleToggleCargo}
            />
          )}
        </>
      )}
    </div>
  );
}

export default Cargos;
