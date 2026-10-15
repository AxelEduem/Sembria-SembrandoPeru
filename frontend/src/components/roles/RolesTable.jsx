import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  BriefcaseBusiness,
  CheckCircle2,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Shield,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import ExpandableDescription from "@/components/ui/ExpandableDescription";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";

const PAGE_SIZE = 5;
const MENU_WIDTH = 192;
const MENU_GAP = 6;

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function RolesTable({
  roles = [],
  emptyMessage,
  onEdit,
  onCargos,
  onPermissions,
  onToggleActive,
  canEdit = false,
  canManageCargos = false,
  canManagePermissions = false,
  canToggle = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const menuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(roles.length / PAGE_SIZE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRoles = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return roles.slice(startIndex, startIndex + PAGE_SIZE);
  }, [roles, safeCurrentPage]);

  const startRow = roles.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;

  const endRow = Math.min(safeCurrentPage * PAGE_SIZE, roles.length);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (event.target.closest("[data-role-actions-trigger]")) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    function handleResize() {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleOutsideClick);

      document.addEventListener("keydown", handleEscape);

      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("resize", handleResize);
    };
  }, [openMenuId]);

  function openActionsMenu(event, roleId) {
    event.stopPropagation();

    if (openMenuId === roleId) {
      setOpenMenuId(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const scrollLeft = window.scrollX;

    let left = buttonRect.right + scrollLeft - MENU_WIDTH;

    const top = buttonRect.bottom + window.scrollY + MENU_GAP;

    if (left < scrollLeft + 8) {
      left = scrollLeft + 8;
    }

    if (left + MENU_WIDTH > scrollLeft + viewportWidth - 8) {
      left = scrollLeft + viewportWidth - MENU_WIDTH - 8;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(roleId);
  }

  function handlePermissions(role) {
    setOpenMenuId(null);
    onPermissions(role);
  }

  function handleCargos(role) {
    setOpenMenuId(null);
    onCargos(role);
  }

  function handleEdit(role) {
    setOpenMenuId(null);
    onEdit(role);
  }

  function handleToggleActive(role) {
    setOpenMenuId(null);
    onToggleActive(role);
  }

  const selectedRole =
    openMenuId !== null ? roles.find((role) => String(role.id) === String(openMenuId)) : null;
  const hasRowActions = canEdit || canManageCargos || canManagePermissions || canToggle;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[1180px] table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[27%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Rol
              </th>

              <th className="w-[21%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Código
              </th>

              <th className="w-[16%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Descripción
              </th>

              <th className="w-[11%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Acceso
              </th>

              <th className="w-[9%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>

              <th className="w-[9%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Creación
              </th>

              <th className="w-[7%] px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedRoles.map((role, index) => (
              <tr
                key={role.id}
                style={{ animationDelay: `${260 + index * 55}ms` }}
                className="module-row-enter group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60"
              >
                <td className="px-5 py-4 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 transition-colors duration-150 group-hover:bg-emerald-100">
                      <ShieldCheck className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0">
                      <p className="whitespace-normal leading-5 font-semibold break-words text-slate-800">
                        {role.nombre}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 align-middle">
                  <span className="inline-flex max-w-full items-start gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-600">
                    <KeyRound className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={1.8} />
                    <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">
                      {role.codigo}
                    </span>
                  </span>
                </td>

                <td className="px-5 py-4 align-middle">
                  <ExpandableDescription
                    description={role.descripcion}
                    recordName={role.nombre}
                    lines={2}
                  />
                </td>

                <td className="px-5 py-4 align-middle">
                  {role.acceso_total ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Total
                    </span>
                  ) : canManagePermissions ? (
                    <button
                      type="button"
                      onClick={() => onPermissions(role)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Shield className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Configurar
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      <Shield className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Personalizado
                    </span>
                  )}
                </td>

                <td className="px-5 py-4 align-middle">
                  {role.activo ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                      <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                      Inactivo
                    </span>
                  )}
                </td>

                <td className="px-5 py-4 align-middle">
                  <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                    {formatDate(role.created_at)}
                  </p>
                </td>

                <td className="w-[90px] px-5 py-4 align-middle">
                  <div className="flex min-h-[40px] items-center justify-center">
                    {hasRowActions && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-role-actions-trigger
                        onClick={(event) => openActionsMenu(event, role.id)}
                        aria-label={`Acciones para ${role.nombre}`}
                        aria-expanded={openMenuId === role.id}
                        className={`h-8 w-8 rounded-lg transition-colors ${
                          openMenuId === role.id
                            ? "bg-slate-100 text-slate-700"
                            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {roles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <Shield className="h-5 w-5 text-slate-400" strokeWidth={1.7} />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">
                      {emptyMessage || "No hay roles registrados."}
                    </p>

                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Intenta modificar los filtros de búsqueda o registra un nuevo rol.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedRole &&
        hasRowActions &&
        createPortal(
          <div
            ref={menuRef}
            className="absolute z-[100] w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {canManagePermissions && (
              <button
                type="button"
                onClick={() => handlePermissions(selectedRole)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Shield className="h-3.5 w-3.5" strokeWidth={1.8} />
                Gestionar permisos
              </button>
            )}

            {canManageCargos && (
              <button
                type="button"
                onClick={() => handleCargos(selectedRole)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <BriefcaseBusiness className="h-3.5 w-3.5" strokeWidth={1.8} />
                Gestionar cargos
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => handleEdit(selectedRole)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Editar
              </button>
            )}

            {canToggle && (
              <button
                type="button"
                onClick={() => handleToggleActive(selectedRole)}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition-colors ${
                  selectedRole.activo
                    ? "text-slate-500 hover:bg-red-50 hover:text-red-600"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {selectedRole.activo ? (
                  <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                )}

                {selectedRole.activo ? "Desactivar" : "Activar"}
              </button>
            )}
          </div>,
          document.body,
        )}

      <TablePagination
        currentPage={safeCurrentPage}
        endRow={endRow}
        itemLabel="roles"
        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
        pageSize={PAGE_SIZE}
        startRow={startRow}
        totalItems={roles.length}
        totalPages={totalPages}
      />
    </section>
  );
}

export default memo(RolesTable);
