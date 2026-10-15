import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  Clock3,
  KeyRound,
  Mail,
  MoreHorizontal,
  RefreshCw,
  ShieldOff,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import { getAvatarUrl } from "@/utils/avatar";
import { getInitials } from "@/utils/formatters";

const PAGE_SIZE = 6;
const MENU_WIDTH = 200;
const MENU_GAP = 6;

function typeLabel(type) {
  if (type === "practicante") return "Practicante";
  if (type === "gerente") return "Gerente";
  return "Voluntario";
}

function AccessBadge({ row }) {
  if (!row.acceso_configurado) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Clock3 className="h-3.5 w-3.5" /> Pendiente
      </span>
    );
  }
  if (row.activo) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <ShieldOff className="h-3.5 w-3.5" /> Inactivo
    </span>
  );
}

export default function UsuariosTable({
  rows,
  onConfigure,
  onResendCredentials,
  onEditEmail,
  canConfigure,
  canResetPassword,
  canEditEmail,
  emptyMessage,
}) {
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = useMemo(
    () => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, rows],
  );

  useEffect(() => {
    function handleOutsideClick(event) {
      if (event.target.closest("[data-user-actions-trigger]")) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpenMenuId(null);
    }

    function handleScroll() {
      if (openMenuId !== null) setOpenMenuId(null);
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

  function openActionsMenu(event, rowId) {
    event.stopPropagation();

    if (openMenuId === rowId) {
      setOpenMenuId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.right - MENU_WIDTH;
    let top = rect.bottom + MENU_GAP;

    if (left < 8) left = 8;
    if (left + MENU_WIDTH > viewportWidth - 8) left = viewportWidth - MENU_WIDTH - 8;

    const estimatedHeight =
      (canResetPassword ? 36 : 0) + (canEditEmail ? 36 : 0) + 12;
    if (top + estimatedHeight > viewportHeight - 8) {
      top = rect.top - estimatedHeight - MENU_GAP;
    }
    if (top < 8) top = 8;

    setMenuPosition({ top, left });
    setOpenMenuId(rowId);
  }

  function handleResend(row) {
    setOpenMenuId(null);
    onResendCredentials(row);
  }

  function handleEditEmail(row) {
    setOpenMenuId(null);
    onEditEmail(row);
  }

  const selectedRow =
    openMenuId !== null
      ? visibleRows.find((row) => row.integrante_id === openMenuId)
      : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-225 text-left">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-5 py-3.5">Integrante</th>
              <th className="px-5 py-3.5">Vinculación</th>
              <th className="px-5 py-3.5">Área y cargo</th>
              <th className="px-5 py-3.5">Correo institucional</th>
              <th className="px-5 py-3.5">Estado de acceso</th>
              <th className="px-5 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row) => {
              const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

              return (
              <tr key={row.integrante_id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <EnlargeablePhoto
                        src={avatarUrl}
                        fallbackSrc={getAvatarUrl(row.avatar_path)}
                        alt={`Foto de ${row.nombre || "integrante"}`}
                        className="h-9 w-9 rounded-xl border border-emerald-100 bg-emerald-50"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700">
                        {getInitials(row.nombre) || <UserRound className="h-4 w-4" />}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{row.nombre}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {typeLabel(row.tipo_integrante)}
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-700">{row.cargo}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{row.area}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-600">
                  {row.correo || <span className="text-slate-400">Aún no asignado</span>}
                </td>
                <td className="px-5 py-4">
                  <AccessBadge row={row} />
                </td>
                <td className="px-5 py-4 text-right">
                  {!row.acceso_configurado && row.integrante_activo && canConfigure ? (
                    <Button
                      type="button"
                      onClick={() => onConfigure(row)}
                      className="bg-[#2D5A3D] text-white hover:bg-[#234B32]"
                    >
                      <KeyRound className="h-4 w-4" /> Configurar acceso
                    </Button>
                  ) : row.acceso_configurado && (canResetPassword || canEditEmail) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-user-actions-trigger
                      onClick={(event) => openActionsMenu(event, row.integrante_id)}
                      aria-label={`Acciones para ${row.nombre}`}
                      aria-expanded={openMenuId === row.integrante_id}
                      className={`h-8 w-8 rounded-lg transition-colors ${
                        openMenuId === row.integrante_id
                          ? "bg-slate-100 text-slate-700"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <MoreHorizontal className="h-4 w-4" strokeWidth={2} />
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">
                      {row.acceso_configurado ? "Configurado" : "Integrante inactivo"}
                    </span>
                  )}
                </td>
              </tr>
              );
            })}
            {!visibleRows.length && (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center">
                  <UserRound className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">
                    {emptyMessage || "No encontramos integrantes"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Prueba con otro filtro o registra primero al integrante.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {selectedRow &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_12px_35px_rgba(15,23,42,0.16)]"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            {canResetPassword && (
              <button
                type="button"
                onClick={() => handleResend(selectedRow)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
                Restablecer contraseña
              </button>
            )}

            {canEditEmail && (
              <button
                type="button"
                onClick={() => handleEditEmail(selectedRow)}
                className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.8} />
                Editar correo
              </button>
            )}
          </div>,
          document.body,
        )}

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={rows.length}
        startRow={(currentPage - 1) * PAGE_SIZE + 1}
        endRow={Math.min(currentPage * PAGE_SIZE, rows.length)}
        itemLabel="integrantes"
        onPrevious={() => setPage((value) => Math.max(1, value - 1))}
        onNext={() => setPage((value) => Math.min(totalPages, value + 1))}
      />
    </section>
  );
}
