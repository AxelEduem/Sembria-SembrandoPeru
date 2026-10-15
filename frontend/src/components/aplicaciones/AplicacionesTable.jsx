import { AppWindow, Check, MoreHorizontal, Pencil, Power } from "lucide-react";
import { createPortal } from "react-dom";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";

import { PERMISSIONS, hasPermission } from "@/utils/permissions";

import AplicacionLogo from "../ui/AplicacionLogo";
import AplicacionStatusBadge from "./AplicacionStatusBadge";

const PAGE_SIZE = 5;
const MENU_WIDTH = 160;
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

function AplicacionesTable({
  aplicaciones,
  areas = [],
  profile,
  canManageEdit,
  canManageDeactivate,
  emptyMessage,
  onEdit,
  onDeactivate,
  onActivate,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const [openMenuId, setOpenMenuId] = useState(null);

  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const menuRef = useRef(null);

  const profileAreaId =
    profile?.area_id === null || profile?.area_id === undefined ? null : Number(profile.area_id);

  function getAreaName(areaId) {
    if (!areaId) {
      return "General";
    }

    const area = areas.find((item) => Number(item.id) === Number(areaId));

    return area?.nombre || "Área desconocida";
  }

  function canManageApplication(aplicacion) {
    if (!hasPermission(profile, PERMISSIONS.APLICACIONES_VER)) {
      return false;
    }

    if (!canManageEdit && !canManageDeactivate) {
      return false;
    }

    if (!profileAreaId) {
      return true;
    }

    if (!aplicacion.area_id) {
      return true;
    }

    return Number(aplicacion.area_id) === profileAreaId;
  }

  const totalPages = Math.max(1, Math.ceil(aplicaciones.length / PAGE_SIZE));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAplicaciones = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return aplicaciones.slice(startIndex, startIndex + PAGE_SIZE);
  }, [aplicaciones, safeCurrentPage]);

  const startRow = aplicaciones.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;

  const endRow = Math.min(safeCurrentPage * PAGE_SIZE, aplicaciones.length);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (event.target.closest("[data-aplicacion-actions-trigger]")) {
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

    function handleScroll() {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleOutsideClick);

      document.addEventListener("keydown", handleEscape);

      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);

      document.removeEventListener("keydown", handleEscape);

      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

  function openActionsMenu(event, aplicacionId) {
    event.stopPropagation();

    if (openMenuId === aplicacionId) {
      setOpenMenuId(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();

    const viewportWidth = window.innerWidth;

    const viewportHeight = window.innerHeight;

    let left = buttonRect.right - MENU_WIDTH;

    let top = buttonRect.bottom + MENU_GAP;

    if (left < 8) {
      left = 8;
    }

    if (left + MENU_WIDTH > viewportWidth - 8) {
      left = viewportWidth - MENU_WIDTH - 8;
    }

    const estimatedMenuHeight = (canManageEdit ? 40 : 0) + (canManageDeactivate ? 40 : 0) + 12;

    if (top + estimatedMenuHeight > viewportHeight - 8) {
      top = buttonRect.top - estimatedMenuHeight - MENU_GAP;
    }

    if (top < 8) {
      top = 8;
    }

    setMenuPosition({
      top,
      left,
    });

    setOpenMenuId(aplicacionId);
  }

  function handleEdit(aplicacion) {
    setOpenMenuId(null);
    onEdit(aplicacion);
  }

  function handleDeactivate(aplicacion) {
    setOpenMenuId(null);
    onDeactivate(aplicacion);
  }

  function handleActivate(aplicacion) {
    setOpenMenuId(null);
    onActivate(aplicacion);
  }

  const hasActions = canManageEdit || canManageDeactivate;

  const selectedAplicacion =
    openMenuId !== null ? aplicaciones.find((aplicacion) => aplicacion.id === openMenuId) : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[960px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />

            {hasActions && (
              <col
                style={{
                  width: "13%",
                }}
              />
            )}
          </colgroup>

          <thead>
            <tr className="bg-slate-50/70">
              <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Aplicación
              </th>

              <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Descripción
              </th>

              <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Área
              </th>

              <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Licencias
              </th>

              <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>

              <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Creación
              </th>

              {hasActions && (
                <th className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedAplicaciones.map((aplicacion, index) => {
              const canManageRow = canManageApplication(aplicacion);

              return (
                <tr
                  key={aplicacion.id}
                  style={{ animationDelay: `${260 + index * 55}ms` }}
                  className="module-row-enter group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      <AplicacionLogo aplicacion={aplicacion} />

                      <div className="min-w-0 flex-1">
                        <p
                          className="line-clamp-2 leading-5 font-semibold break-words text-slate-800"
                          title={aplicacion.nombre}
                        >
                          {aplicacion.nombre}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="min-w-0 px-5 py-4 align-middle text-center">
                    <div className="max-w-full min-w-0 overflow-hidden">
                      {aplicacion.descripcion ? (
                        <p
                          className="line-clamp-2 max-w-full overflow-hidden text-sm leading-5 break-words text-slate-500"
                          title={aplicacion.descripcion}
                        >
                          {aplicacion.descripcion}
                        </p>
                      ) : (
                        <span className="text-sm text-slate-300">Sin descripción</span>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <span
                      className={`inline-flex max-w-full items-center overflow-hidden rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        aplicacion.area_id
                          ? "border border-blue-100 bg-blue-50 text-blue-700"
                          : "border border-emerald-100 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      <span className="truncate" title={getAreaName(aplicacion.area_id)}>
                        {getAreaName(aplicacion.area_id)}
                      </span>
                    </span>
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <p className="text-sm font-semibold text-slate-700">
                      {aplicacion.licencias_total}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <AplicacionStatusBadge active={aplicacion.activo} />
                  </td>

                  <td className="px-5 py-4 text-center align-middle">
                    <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                      {formatDate(aplicacion.created_at)}
                    </p>
                  </td>

                  {hasActions && (
                    <td className="w-[90px] px-5 py-4 align-middle">
                      <div className="flex min-h-[40px] items-center justify-center">
                        {canManageRow ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            data-aplicacion-actions-trigger
                            onClick={(event) => openActionsMenu(event, aplicacion.id)}
                            aria-label={`Acciones para ${aplicacion.nombre}`}
                            aria-expanded={openMenuId === aplicacion.id}
                            className={`h-8 w-8 rounded-lg transition-colors ${
                              openMenuId === aplicacion.id
                                ? "bg-slate-100 text-slate-700"
                                : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            }`}
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}

            {aplicaciones.length === 0 && (
              <tr>
                <td colSpan={hasActions ? 7 : 6} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                   <AppWindow className="mx-auto h-8 w-8 text-slate-300" strokeWidth={1.7} />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>

                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Intenta modificar la búsqueda o registra una nueva aplicación.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedAplicacion && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
          }}
        >
          {canManageEdit && (
            <button
              type="button"
              onClick={() => handleEdit(selectedAplicacion)}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
              Editar
            </button>
          )}

          {canManageDeactivate && selectedAplicacion.activo && (
            <button
              type="button"
              onClick={() => handleDeactivate(selectedAplicacion)}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
            >
              <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
              Desactivar
            </button>
          )}

          {canManageDeactivate && !selectedAplicacion.activo && (
            <button
              type="button"
              onClick={() => handleActivate(selectedAplicacion)}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
              Activar
            </button>
          )}
        </div>,
        document.body,
      )}

      <TablePagination
        currentPage={safeCurrentPage}
        endRow={endRow}
        itemLabel="aplicaciones"
        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
        pageSize={PAGE_SIZE}
        startRow={startRow}
        totalItems={aplicaciones.length}
        totalPages={totalPages}
      />
    </section>
  );
}

export default memo(AplicacionesTable);
