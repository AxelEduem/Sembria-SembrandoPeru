import { useCallback, useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";

import RolFormDialog from "@/components/roles/RolFormDialog";
import RolCargosDialog from "@/components/roles/RolCargosDialog";
import RolPermisosDialog from "@/components/roles/RolPermisosDialog";
import RolesFilters from "@/components/roles/RolesFilters";
import RolesTable from "@/components/roles/RolesTable";

import { ROLE_STATUS_FILTERS, ROLE_STATUS_OPTIONS, useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/contexts/AuthContext";

import { downloadExcel, formatExcelDate } from "@/utils/excelExport";
import { PERMISSIONS, getPermissionScope, getRoleId } from "@/utils/permissions";

function Roles() {
  const { profile, refreshProfile } = useAuth();
  const canCreate = getPermissionScope(profile, PERMISSIONS.ROLES_CREAR) === "global";
  const canEdit = getPermissionScope(profile, PERMISSIONS.ROLES_EDITAR) === "global";
  const canToggle = getPermissionScope(profile, PERMISSIONS.ROLES_DESACTIVAR) === "global";
  const canManagePermissions =
    getPermissionScope(profile, PERMISSIONS.ROLES_GESTIONAR_PERMISOS) === "global";
  const canManageCargos =
    getPermissionScope(profile, PERMISSIONS.ROLES_GESTIONAR_CARGOS) === "global";

  const {
    roles,
    permisosPorModulo,
    loading,
    saving,
    feedback,
    setFeedback,
    create,
    update,
    setActive,
    getPermissionsForRole,
    savePermissions,
    getCargosForRole,
    saveCargos,
  } = useRoles({ includePermissions: canManagePermissions });

  const [formOpen, setFormOpen] = useState(false);

  const [editingRole, setEditingRole] = useState(null);

  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const [permissionsRole, setPermissionsRole] = useState(null);

  const [cargosOpen, setCargosOpen] = useState(false);

  const [cargosRole, setCargosRole] = useState(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState(ROLE_STATUS_FILTERS.TODAS);

  const [dateFilter, setDateFilter] = useState("");

  const filteredRoles = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return roles.filter((role) => {
      const matchesSearch =
        !normalizedSearch ||
        role.nombre?.toLowerCase().includes(normalizedSearch) ||
        role.codigo?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === ROLE_STATUS_FILTERS.TODAS ||
        (statusFilter === ROLE_STATUS_FILTERS.ACTIVO && role.activo) ||
        (statusFilter === ROLE_STATUS_FILTERS.INACTIVO && !role.activo);

      const matchesDate =
        !dateFilter ||
        (role.created_at && new Date(role.created_at).toISOString().slice(0, 10) === dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [roles, search, statusFilter, dateFilter]);

  const hasFilters =
    Boolean(search) || statusFilter !== ROLE_STATUS_FILTERS.TODAS || Boolean(dateFilter);

  const openCreate = useCallback(() => {
    if (!canCreate) return;
    setEditingRole(null);
    setFormOpen(true);
  }, [canCreate]);

  const openEdit = useCallback(
    (role) => {
      if (!canEdit) return;
      setEditingRole(role);
      setFormOpen(true);
    },
    [canEdit],
  );

  const openPermissions = useCallback(
    (role) => {
      if (!canManagePermissions) return;
      setPermissionsRole(role);
      setPermissionsOpen(true);
    },
    [canManagePermissions],
  );

  const openCargos = useCallback(
    (role) => {
      if (!canManageCargos) return;
      setCargosRole(role);
      setCargosOpen(true);
    },
    [canManageCargos],
  );

  const handleFormOpenChange = useCallback(
    (open) => {
      if (saving) {
        return;
      }

      setFormOpen(open);

      if (!open) {
        setEditingRole(null);
      }
    },
    [saving],
  );

  const handlePermissionsOpenChange = useCallback(
    (open) => {
      if (saving) {
        return;
      }

      setPermissionsOpen(open);

      if (!open) {
        setPermissionsRole(null);
      }
    },
    [saving],
  );

  const handleCargosOpenChange = useCallback(
    (open) => {
      if (saving) return;

      setCargosOpen(open);

      if (!open) setCargosRole(null);
    },
    [saving],
  );

  const handleFormSubmit = useCallback(
    async (input) => {
      if (editingRole) {
        const result = await update(editingRole.id, input);

        if (result?.success && getRoleId(profile) === Number(editingRole.id)) {
          await refreshProfile({ silent: true });
        }

        return result;
      }

      return create(input);
    },
    [create, editingRole, profile, refreshProfile, update],
  );

  const handleSavePermissions = useCallback(
    async (roleId, permissions, options = {}) => {
      const result = await savePermissions(roleId, permissions, options);

      if (result?.success && getRoleId(profile) === Number(roleId)) {
        await refreshProfile({ silent: true });
      }

      return result;
    },
    [profile, refreshProfile, savePermissions],
  );

  const handleToggleActive = useCallback(
    async (role) => {
      if (!role) {
        return;
      }

      if (!canToggle) return;

      await setActive(role.id, !role.activo);
    },
    [canToggle, setActive],
  );

  const handleDownloadExcel = useCallback(() => {
    downloadExcel(
      {
        headers: ["Rol", "Codigo", "Descripcion", "Acceso", "Estado", "Creacion"],
        data: filteredRoles.map((role) => [
          role.nombre,
          role.codigo,
          role.descripcion || "",
          role.acceso_total ? "Total" : "Personalizado",
          role.activo ? "Activo" : "Inactivo",
          formatExcelDate(role.created_at),
        ]),
      },
      "roles.xls",
    );
  }, [filteredRoles]);

  const emptyMessage = useMemo(() => {
    if (!roles.length) {
      return "Aun no existen roles registrados.";
    }

    if (hasFilters) {
      return "No encontramos roles que coincidan con tu busqueda.";
    }

    return "Aun no existen roles registrados.";
  }, [roles.length, hasFilters]);

  return (
    <div className="module-page-enter pb-6">
      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadExcel}
            className="h-10 w-full shrink-0 gap-2 rounded-xl px-4 sm:w-auto"
          >
            <ExcelIcon className="h-4 w-4" />
            Descargar Excel
          </Button>

          {canCreate && (
            <Button
              type="button"
              onClick={openCreate}
              className="h-10 w-full shrink-0 gap-2 rounded-xl bg-[#2D5A3D] px-4 text-white shadow-sm shadow-emerald-900/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#234B32] hover:shadow-md sm:w-auto"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo rol
            </Button>
          )}
        </div>
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <RolesFilters
          search={search}
          statusFilter={statusFilter}
          dateFilter={dateFilter}
          statusOptions={ROLE_STATUS_OPTIONS}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
          onDateFilterChange={setDateFilter}
        />
      </div>

      <FeedbackToast feedback={feedback} onClose={() => setFeedback(null)} />
      {loading ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            </div>

            <p className="text-sm font-medium text-slate-700">Cargando roles</p>

            <p className="mt-1 text-xs text-slate-400">
              Estamos obteniendo la información de roles y permisos.
            </p>
          </div>
        </section>
      ) : (
        <div className="module-section-enter module-enter-delay-3">
          <RolesTable
            key={`${search}-${statusFilter}-${dateFilter}`}
            roles={filteredRoles}
            emptyMessage={emptyMessage}
            onEdit={openEdit}
            onCargos={openCargos}
            onPermissions={openPermissions}
            onToggleActive={handleToggleActive}
            canEdit={canEdit}
            canManageCargos={canManageCargos}
            canManagePermissions={canManagePermissions}
            canToggle={canToggle}
          />
        </div>
      )}

      {formOpen && (
        <RolFormDialog
          key={editingRole?.id || "new-role"}
          open={formOpen}
          role={editingRole}
          loading={saving}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleFormSubmit}
        />
      )}

      <RolPermisosDialog
        open={permissionsOpen}
        role={permissionsRole}
        permisosPorModulo={permisosPorModulo}
        loading={saving}
        onOpenChange={handlePermissionsOpenChange}
        onLoadPermissions={getPermissionsForRole}
        onSavePermissions={handleSavePermissions}
      />

      <RolCargosDialog
        open={cargosOpen}
        role={cargosRole}
        loading={saving}
        onOpenChange={handleCargosOpenChange}
        onLoadCargos={getCargosForRole}
        onSaveCargos={saveCargos}
      />
    </div>
  );
}

export default Roles;
