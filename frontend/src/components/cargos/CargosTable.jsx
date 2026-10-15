import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { BriefcaseBusiness, Check, MoreHorizontal, Pencil, Power, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import ExpandableDescription from "@/components/ui/ExpandableDescription";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";

import CargoStatusBadge from "./CargoStatusBadge";

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

function CargosTable({
  cargos,
  canEdit,
  canToggle,
  emptyMessage,
  loading = false,
  onEdit,
  onToggleActive,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const menuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(cargos.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCargos = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;

    return cargos.slice(startIndex, startIndex + PAGE_SIZE);
  }, [safeCurrentPage, cargos]);

  const startRow = cargos.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(safeCurrentPage * PAGE_SIZE, cargos.length);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (event.target.closest("[data-cargo-actions-trigger]")) {
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

  function openActionsMenu(event, cargoId) {
    event.stopPropagation();

    if (openMenuId === cargoId) {
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

    const estimatedMenuHeight = (canEdit ? 40 : 0) + (canToggle ? 40 : 0) + 12;

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

    setOpenMenuId(cargoId);
  }

  function handleEdit(cargo) {
    setOpenMenuId(null);
    onEdit(cargo);
  }

  function handleToggleActive(cargo) {
    setOpenMenuId(null);
    onToggleActive(cargo);
  }

  const hasActions = canEdit || canToggle;

  const selectedCargo =
    openMenuId !== null ? cargos.find((cargo) => cargo.id === openMenuId) : null;

  return (
    <section
      aria-busy={loading}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]"
    >
      <div className="overflow-x-auto">
        <Table
          className="w-full min-w-[860px] table-fixed border-collapse"
          loading={loading}
          loadingLabel="Cargando cargos..."
        >
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[20%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Cargo
              </th>

              <th className="w-[15%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Área
              </th>

              <th className="w-[18%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Rol
              </th>

              <th className="w-[18%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Descripción
              </th>

              <th className="w-[10%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>

              <th className="w-[10%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Creación
              </th>

              {hasActions && (
                <th className="w-[10%] px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr className="border-t border-slate-100">
                <td colSpan={hasActions ? 7 : 6} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                    <p className="text-sm font-medium text-slate-700">Cargando cargos...</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              paginatedCargos.map((cargo, index) => (
                <tr
                  key={cargo.id}
                  style={{ animationDelay: `${260 + index * 55}ms` }}
                  className="module-row-enter group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 transition-colors duration-150 group-hover:bg-emerald-100">
                        <BriefcaseBusiness className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
                      </div>

                      <p className="min-w-0 whitespace-normal leading-5 font-semibold break-words text-slate-800">
                        {cargo.nombre}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <p className="whitespace-normal text-sm leading-5 break-words text-slate-600">
                      {cargo.area}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    {cargo.rol ? (
                      <span className="inline-flex max-w-full items-start gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />

                        <span className="line-clamp-2 break-words">{cargo.rol.nombre}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                        Sin rol asignado
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <ExpandableDescription
                      description={cargo.descripcion}
                      recordName={cargo.nombre}
                      lines={2}
                    />
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <CargoStatusBadge active={cargo.activo} />
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <p className="text-sm font-medium whitespace-nowrap text-slate-600">
                      {formatDate(cargo.created_at)}
                    </p>
                  </td>

                  {hasActions && (
                    <td className="w-[90px] px-5 py-4 align-middle">
                      <div className="flex min-h-[40px] items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-cargo-actions-trigger
                          onClick={(event) => openActionsMenu(event, cargo.id)}
                          aria-label={`Acciones para ${cargo.nombre}`}
                          aria-expanded={openMenuId === cargo.id}
                          className={`h-8 w-8 rounded-lg transition-colors ${
                            openMenuId === cargo.id
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

            {!loading && cargos.length === 0 && (
              <tr>
                <td colSpan={hasActions ? 7 : 6} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <BriefcaseBusiness className="h-5 w-5 text-slate-400" strokeWidth={1.7} />
                    </div>

                    <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>

                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Intenta modificar los filtros de búsqueda o registra un nuevo cargo.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedCargo &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {canEdit && (
              <button
                type="button"
                onClick={() => handleEdit(selectedCargo)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Editar
              </button>
            )}

            {canToggle && (
              <button
                type="button"
                onClick={() => handleToggleActive(selectedCargo)}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium transition-colors ${
                  selectedCargo.activo
                    ? "text-slate-500 hover:bg-red-50 hover:text-red-600"
                    : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {selectedCargo.activo ? (
                  <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
                ) : (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                )}

                {selectedCargo.activo ? "Desactivar" : "Activar"}
              </button>
            )}
          </div>,
          document.body,
        )}

      {!loading && (
        <TablePagination
          currentPage={safeCurrentPage}
          endRow={endRow}
          itemLabel="cargos"
          onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
          pageSize={PAGE_SIZE}
          startRow={startRow}
          totalItems={cargos.length}
          totalPages={totalPages}
        />
      )}
    </section>
  );
}

export default CargosTable;
