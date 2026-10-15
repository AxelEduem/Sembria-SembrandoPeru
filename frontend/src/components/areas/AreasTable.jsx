import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Building2, Check, MoreHorizontal, Pencil, Power } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExpandableDescription from "@/components/ui/ExpandableDescription";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";

import AreaStatusBadge from "./AreaStatusBadge";

const PAGE_SIZE = 5;
const MENU_WIDTH = 160;
const MENU_GAP = 6;

function formatDate(value) {
  if (!value) return "-";

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

function AreasTable({
  areas,
  canEdit,
  canToggle,
  emptyMessage,
  loading = false,
  onEdit,
  onToggleActive,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(areas.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAreas = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return areas.slice(startIndex, startIndex + PAGE_SIZE);
  }, [areas, safeCurrentPage]);

  const startRow = areas.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(safeCurrentPage * PAGE_SIZE, areas.length);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (event.target.closest("[data-area-actions-trigger]")) {
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

  function openActionsMenu(event, areaId) {
    event.stopPropagation();

    if (openMenuId === areaId) {
      setOpenMenuId(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = buttonRect.right - MENU_WIDTH;
    let top = buttonRect.bottom + MENU_GAP;

    if (left < 8) left = 8;
    if (left + MENU_WIDTH > viewportWidth - 8) left = viewportWidth - MENU_WIDTH - 8;

    const estimatedMenuHeight = 92;
    if (top + estimatedMenuHeight > viewportHeight - 8) {
      top = buttonRect.top - estimatedMenuHeight - MENU_GAP;
    }
    if (top < 8) top = 8;

    setMenuPosition({ top, left });
    setOpenMenuId(areaId);
  }

  function handleEdit(area) {
    setOpenMenuId(null);
    onEdit(area);
  }

  function handleToggleActive(area) {
    setOpenMenuId(null);
    onToggleActive(area);
  }

  const selectedArea =
    openMenuId !== null ? areas.find((area) => String(area.id) === String(openMenuId)) : null;

  return (
    <section
      aria-busy={loading}
      className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
    >
      <div className="w-full min-w-0 overflow-hidden">
        <Table
          className="w-full max-w-full table-fixed border-collapse"
          loading={loading}
          loadingLabel="Cargando áreas..."
        >
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[34%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            {(canEdit || canToggle) && <col className="w-[12%]" />}
          </colgroup>

          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[40%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Area
              </th>
              <th className="w-[30%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Descripcion
              </th>
              <th className="w-[15%] px-3 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>
              <th className="w-[15%] px-3 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Creacion
              </th>
              {(canEdit || canToggle) && (
                <th className="w-[5%] px-1 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr className="border-t border-slate-100">
                <td colSpan={canEdit || canToggle ? 5 : 4} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">Cargando áreas...</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              paginatedAreas.map((area, index) => (
                <tr
                  key={area.id}
                  style={{ animationDelay: `${260 + index * 55}ms` }}
                  className="module-row-enter group border-t border-slate-100 hover:bg-slate-50/60"
                >
                  <td className="w-[30%] max-w-0 min-w-0 overflow-hidden px-5 py-4 align-middle">
                    <div className="flex max-w-full min-w-0 items-center gap-3 overflow-hidden">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50">
                        <Building2 className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                      </div>
                      <p className="line-clamp-2 max-w-full min-w-0 overflow-hidden leading-5 font-semibold break-words text-slate-800">
                        {area.nombre}
                      </p>
                    </div>
                  </td>

                  <td className="w-[34%] max-w-0 min-w-0 overflow-hidden px-5 py-4 align-middle">
                    <ExpandableDescription
                      description={area.descripcion}
                      recordName={area.nombre}
                      lines={2}
                    />
                  </td>

                  <td className="w-[12%] max-w-0 min-w-0 overflow-hidden px-3 py-4 align-middle">
                    <AreaStatusBadge active={area.activo} />
                  </td>

                  <td className="w-[12%] max-w-0 min-w-0 overflow-hidden px-3 py-4 align-middle">
                    <p className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-slate-600">
                      {formatDate(area.created_at)}
                    </p>
                  </td>

                  {(canEdit || canToggle) && (
                    <td className="w-[12%] max-w-0 min-w-0 overflow-hidden px-1 py-4 align-middle">
                      <div className="flex min-h-[40px] w-full items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-area-actions-trigger
                          onClick={(event) => openActionsMenu(event, area.id)}
                          aria-label={`Acciones para ${area.nombre}`}
                          aria-expanded={openMenuId === area.id}
                          className={`h-8 w-8 shrink-0 rounded-lg transition-colors ${
                            openMenuId === area.id
                              ? "bg-slate-100 text-slate-700"
                              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          }`}
                        >
                          <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

            {!loading && areas.length === 0 && (
              <tr>
                <td colSpan={canEdit || canToggle ? 5 : 4} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <Building2 className="h-5 w-5 text-slate-400" strokeWidth={1.7} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedArea &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
          >
            {canEdit && (
              <button
                type="button"
                onClick={() => handleEdit(selectedArea)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Editar
              </button>
            )}

            {canToggle && (
              <button
                type="button"
                onClick={() => handleToggleActive(selectedArea)}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition-colors ${
                  selectedArea.activo
                    ? "text-slate-500 hover:bg-red-50 hover:text-red-600"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {selectedArea.activo ? (
                  <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                )}
                {selectedArea.activo ? "Desactivar" : "Activar"}
              </button>
            )}
          </div>,
          document.body,
        )}

      {!loading && (
        <TablePagination
          currentPage={safeCurrentPage}
          endRow={endRow}
          itemLabel="areas"
          onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
          pageSize={PAGE_SIZE}
          startRow={startRow}
          totalItems={areas.length}
          totalPages={totalPages}
        />
      )}
    </section>
  );
}

export default AreasTable;
