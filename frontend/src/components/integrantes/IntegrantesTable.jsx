import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Eye,
  History,
  Mail,
  MoreHorizontal,
  Pencil,
  Power,
  RefreshCw,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table } from "@/components/ui/table";
import TablePagination from "@/components/ui/TablePagination";
import CopyValueButton from "@/components/ui/CopyValueButton";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

import IntegranteStatusBadge from "./IntegranteStatusBadge";
import { getAvatarUrl } from "@/utils/avatar";
import { hasPastIntegranteHistories } from "@/services/integrantes/history";

const MENU_WIDTH = 180;
const MENU_GAP = 6;
const VIEWPORT_GAP = 8;

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(".", "");
}

function getInitials(nombre) {
  if (!nombre) return "";
  return String(nombre)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getTipoLabel(tipo) {
  if (tipo === "practicante") return "Practicante";
  if (tipo === "gerente") return "Gerente";
  return "Voluntario";
}

function getTipoClass(tipo) {
  if (tipo === "practicante") return "border-amber-100 bg-amber-50 text-amber-700";
  if (tipo === "gerente") return "border-blue-100 bg-blue-50 text-blue-700";
  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

function IntegrantesTable({
  rows,
  emptyMessage,
  onView,
  onViewHistory,
  onEdit,
  onDeactivate,
  onRestore,
  onRehire,
  canView = false,
  canViewHistory = false,
  canEdit = false,
  canDeactivate = false,
  canActivate = false,
  canRehire = false,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 5,
  startRow = 0,
  endRow = 0,
  onPageChange,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const triggerRefs = useRef(new Map());

  const safeCurrentPage = Math.min(currentPage, totalPages);

  useEffect(() => {
    // Mantiene la página visible cuando una mutación reduce el total de filas.
    if (currentPage > totalPages) onPageChange?.(totalPages);
  }, [currentPage, onPageChange, totalPages]);

  const closeMenu = useCallback(() => {
    setOpenMenuId(null);
  }, []);

  const updateMenuPosition = useCallback(() => {
    if (openMenuId === null) return;
    const trigger = triggerRefs.current.get(String(openMenuId));
    if (!trigger) {
      closeMenu();
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuElement = menuRef.current;
    const menuWidth = menuElement?.offsetWidth || MENU_WIDTH;
    const menuHeight = menuElement?.offsetHeight || 0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - menuWidth;
    if (left < VIEWPORT_GAP) left = rect.left;
    if (left + menuWidth > viewportWidth - VIEWPORT_GAP)
      left = viewportWidth - menuWidth - VIEWPORT_GAP;
    left = Math.max(VIEWPORT_GAP, left);

    const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_GAP;
    const spaceAbove = rect.top - VIEWPORT_GAP;
    let top;
    if (menuHeight > 0 && spaceBelow < menuHeight && spaceAbove >= menuHeight) {
      top = rect.top - menuHeight - MENU_GAP;
    } else {
      top = rect.bottom + MENU_GAP;
    }
    if (menuHeight > 0) {
      top = Math.max(VIEWPORT_GAP, Math.min(top, viewportHeight - menuHeight - VIEWPORT_GAP));
    } else {
      top = Math.max(VIEWPORT_GAP, top);
    }
    setMenuPosition({ top, left });
  }, [closeMenu, openMenuId]);

  useEffect(() => {
    if (openMenuId === null) return undefined;

    function handleOutsideClick(event) {
      if (event.target.closest("[data-integrante-actions-trigger]")) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) closeMenu();
    }

    function handleEscape(event) {
      if (event.key === "Escape") closeMenu();
    }

    function handleViewportChange() {
      updateMenuPosition();
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    const animationFrame = window.requestAnimationFrame(() => {
      updateMenuPosition();
    });

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [closeMenu, openMenuId, updateMenuPosition]);

  useEffect(() => {
    if (openMenuId === null || !menuRef.current) return undefined;
    const resizeObserver = new ResizeObserver(() => updateMenuPosition());
    resizeObserver.observe(menuRef.current);
    return () => resizeObserver.disconnect();
  }, [openMenuId, updateMenuPosition]);

  function openActionsMenu(event, rowId) {
    event.stopPropagation();
    const normalizedId = String(rowId);
    if (String(openMenuId) === normalizedId) {
      closeMenu();
      return;
    }
    const trigger = event.currentTarget;
    triggerRefs.current.set(normalizedId, trigger);
    setOpenMenuId(rowId);
    const rect = trigger.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + MENU_GAP,
      left: Math.max(
        VIEWPORT_GAP,
        Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - VIEWPORT_GAP),
      ),
    });
  }

  const selectedRow =
    openMenuId !== null ? rows.find((row) => String(row.id) === String(openMenuId)) : null;
  function hasActions(row) {
    if (!row) return false;
    if (canView || (canViewHistory && hasPastIntegranteHistories(row))) return true;
    if (row.activo) return canEdit || canDeactivate;
    return canActivate || canRehire;
  }

  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-245 table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[28%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Integrante
              </th>
              <th className="w-[15%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Cargo
              </th>
              <th className="w-[15%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Area
              </th>
              <th className="w-[14%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Tipo
              </th>
              <th className="w-[18%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Periodo
              </th>
              <th className="w-[8%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>
              <th className="w-[8%] px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

              return (
                <tr
                  key={row.id}
                  style={{ animationDelay: `${260 + index * 55}ms` }}
                  className="module-row-enter group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-w-0 items-center gap-3">
                      {avatarUrl ? (
                        <EnlargeablePhoto
                          src={avatarUrl}
                          fallbackSrc={getAvatarUrl(row.avatar_path)}
                          fallback={
                            getInitials(row.nombre) || (
                              <UserRound className="h-4 w-4" strokeWidth={1.8} />
                            )
                          }
                          alt={`Foto de ${row.nombre || "integrante"}`}
                          className="h-9 w-9 rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700 transition-transform hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700 transition-colors group-hover:bg-emerald-100">
                          {getInitials(row.nombre) || (
                            <UserRound className="h-4 w-4" strokeWidth={1.8} />
                          )}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 leading-5 font-semibold wrap-break-word text-slate-800">
                          {row.nombre || "-"}
                        </p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                          <span className="max-w-50 truncate" title={row.correo || undefined}>
                            {row.correo || "-"}
                          </span>
                          <CopyValueButton value={row.correo} label="correo" />
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <div className="flex items-start gap-2">
                      <BriefcaseBusiness
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        strokeWidth={1.8}
                      />
                      <span className="line-clamp-2 text-sm leading-5 font-medium wrap-break-word text-slate-600">
                        {row.cargo || "-"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <p className="line-clamp-2 text-sm leading-5 wrap-break-word text-slate-500">
                      {row.area || "-"}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getTipoClass(
                        row.tipo_integrante,
                      )}`}
                    >
                      {getTipoLabel(row.tipo_integrante)}
                    </span>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <p className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-slate-600">
                      <CalendarDays
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        strokeWidth={1.8}
                      />
                      <span>
                        {formatDate(row.fecha_inicio)} - {formatDate(row.fecha_fin)}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {row.tipo_integrante === "gerente"
                        ? "Sin periodo"
                        : `${row.periodo_meses || "-"} meses`}
                    </p>
                  </td>

                  <td className="px-5 py-4 align-middle">
                    <IntegranteStatusBadge active={row.activo} />
                  </td>

                  <td className="px-5 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
                    <div className="flex min-h-10 items-center justify-center">
                      {hasActions(row) ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-integrante-actions-trigger
                          onClick={(event) => openActionsMenu(event, row.id)}
                          aria-label={`Acciones para ${row.nombre || "integrante"}`}
                          aria-expanded={String(openMenuId) === String(row.id)}
                          className={`h-8 w-8 rounded-lg transition-colors ${
                            String(openMenuId) === String(row.id)
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
                </tr>
              );
            })}

            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <UserRound className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Intenta modificar los filtros o registra un nuevo integrante.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedRow && hasActions(selectedRow) &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-100 w-45 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            role="menu"
          >
            {canView && <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                onView(selectedRow);
              }}
              className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-800"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
              Ver
            </button>}

            {canViewHistory && hasPastIntegranteHistories(selectedRow) && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu();
                  onViewHistory(selectedRow);
                }}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
              >
                <History className="h-3.5 w-3.5" strokeWidth={1.8} />
                Ver historial
              </button>
            )}

            {selectedRow.activo && (canEdit || canDeactivate) && (
              <>
                {canEdit && <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onEdit(selectedRow);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Editar
                </button>}
                {canDeactivate && <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onDeactivate(selectedRow);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
                >
                  <Power className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Desactivar
                </button>}
              </>
            )}

            {!selectedRow.activo && (canActivate || canRehire) && (
              <>
                {canActivate && <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    onRestore(selectedRow);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Activar
                </button>}
                {canRehire && <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu();
                    if (onRehire) onRehire(selectedRow);
                  }}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Recontratar
                </button>}
              </>
            )}
          </div>,
          document.body,
        )}

      <TablePagination
        currentPage={safeCurrentPage}
        endRow={endRow}
        itemLabel="integrantes"
        onNext={() => onPageChange?.(Math.min(totalPages, safeCurrentPage + 1))}
        onPrevious={() => onPageChange?.(Math.max(1, safeCurrentPage - 1))}
        pageSize={pageSize}
        startRow={startRow}
        totalItems={totalItems}
        totalPages={totalPages}
      />
    </section>
  );
}

export default memo(IntegrantesTable);
