import { memo, useMemo } from "react";

import { Search, Settings2, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { Input } from "@/components/ui/input";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import { getAvatarUrl } from "@/utils/avatar";

const PAGE_SIZE = 5;
const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-8 pl-9 text-sm text-slate-700 outline-none transition-all hover:border-slate-300 hover:bg-slate-50/40 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function getInitials(nombre) {
  return String(nombre || "")
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

function VoluntariosSinAccesoTable({
  voluntarios,
  accesosPorIntegrante = new Map(),
  canManage = false,
  accessSearch,
  accessAreaFilter,
  accessCargoFilter,
  accessTypeFilter,
  accessAppFilter = "todas",
  accessLevelFilter = "todos",
  accessAreaOptions,
  accessCargoOptions,
  aplicaciones = [],
  currentPage,
  pageSize = PAGE_SIZE,
  onSearchChange,
  onAreaChange,
  onCargoChange,
  onTypeChange,
  onAppChange,
  onAccessLevelChange,
  onPageChange,
  onManageAccesses,
}) {
  const totalPages = Math.max(Math.ceil(voluntarios.length / pageSize), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedVoluntarios = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return voluntarios.slice(startIndex, startIndex + pageSize);
  }, [pageSize, safeCurrentPage, voluntarios]);
  const startRow = voluntarios.length ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endRow = Math.min(safeCurrentPage * pageSize, voluntarios.length);
  const hasFilters =
    Boolean(accessSearch?.trim()) ||
    accessAreaFilter !== "todas" ||
    accessCargoFilter !== "todos" ||
    accessTypeFilter !== "todos" ||
    accessAppFilter !== "todas" ||
    accessLevelFilter !== "todos";

  function handleClearFilters() {
    onSearchChange("");
    onAreaChange("todas");
    onCargoChange("todos");
    onTypeChange("todos");
    onAppChange?.("todas");
    onAccessLevelChange?.("todos");
  }

  return (
    <>
      <section className="acceso-noaccess-enter mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_repeat(3,minmax(180px,1fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={accessSearch}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="h-10 rounded-xl border-slate-200 bg-slate-50/60 pl-9 shadow-none"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={accessAreaFilter}
              onChange={(event) => onAreaChange(event.target.value)}
              className={selectClass}
            >
              <option value="todas">Todas las áreas</option>
              {accessAreaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={accessCargoFilter}
              onChange={(event) => onCargoChange(event.target.value)}
              className={selectClass}
              disabled={accessAreaFilter === "todas"}
            >
              <option value="todos">Todos los cargos</option>
              {accessCargoOptions.map((cargo) => (
                <option key={cargo} value={cargo}>
                  {cargo}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={accessTypeFilter}
              onChange={(event) => onTypeChange(event.target.value)}
              className={selectClass}
            >
              <option value="todos">Todos los tipos</option>
              <option value="voluntario">Voluntario</option>
              <option value="practicante">Practicante</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_1fr_auto] lg:items-center">
          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={accessAppFilter}
              onChange={(event) => onAppChange(event.target.value)}
              className={selectClass}
            >
              <option value="todas">Selecciona una aplicación</option>
              {aplicaciones.map((aplicacion) => (
                <option key={aplicacion.id} value={aplicacion.id}>
                  {aplicacion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full">
            <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={accessLevelFilter}
              onChange={(event) => onAccessLevelChange(event.target.value)}
              className={selectClass}
            >
              <option value="todos">Seleccionar tipo de acceso</option>
              <option value="con-acceso">Con acceso</option>
              <option value="sin-acceso">Sin acceso</option>
              <option value="cantidad-1">Con acceso a una aplicación</option>
              <option value="cantidad-2">Con acceso a dos aplicaciones</option>
              <option value="cantidad-3">Con acceso a tres aplicaciones</option>
              <option value="cantidad-4">Con acceso a cuatro aplicaciones</option>
              <option value="cantidad-5">Con acceso a cinco aplicaciones</option>
            </select>
          </div>

          <div className="hidden lg:block" />
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            disabled={!hasFilters}
            className="h-10 gap-2 rounded-xl border-red-200 text-red-600 disabled:border-slate-200 disabled:text-slate-300"
          >
            <X className="h-4 w-4" /> Limpiar filtros
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="bg-slate-50/70">
                {[
                  "Integrante",
                  "Tipo",
                  "Área",
                  "Cargo",
                  "Accesos",
                  ...(canManage ? ["Acción"] : []),
                ].map((header) => (
                  <th
                    key={header}
                    className="px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase last:text-right"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedVoluntarios.map((integrante) => {
                const accesos = accesosPorIntegrante.get(String(integrante.historial_id)) || [];
                const avatarUrl =
                  getAvatarUrl(integrante.avatar_url) || getAvatarUrl(integrante.avatar_path);
                return (
                  <tr
                    key={integrante.id}
                    className="border-t border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <EnlargeablePhoto
                            src={avatarUrl}
                            fallbackSrc={getAvatarUrl(integrante.avatar_path)}
                            alt={`Foto de ${integrante.nombre}`}
                            className="h-9 w-9 rounded-lg border border-slate-200 bg-slate-50"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                            {getInitials(integrante.nombre)}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">{integrante.nombre}</p>
                          {integrante.correo && (
                            <p className="text-xs text-slate-400">{integrante.correo}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {getTipoLabel(integrante.tipo_integrante)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">{integrante.area}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{integrante.cargo}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {accesos.length ? (
                          accesos.map((acceso) => (
                            <span
                              key={acceso.id}
                              className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {acceso.aplicacion?.nombre || "Aplicación"}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">
                            Sin acceso
                          </span>
                        )}
                      </div>
                    </td>
                    {canManage && (
                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onManageAccesses(integrante)}
                          className="h-8 gap-1.5 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Settings2 className="h-3.5 w-3.5" /> Gestionar
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {voluntarios.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 6 : 5}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No encontramos integrantes para esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <TablePagination
          currentPage={safeCurrentPage}
          endRow={endRow}
          itemLabel="integrantes"
          onNext={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          onPrevious={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          pageSize={pageSize}
          startRow={startRow}
          totalItems={voluntarios.length}
          totalPages={totalPages}
        />
      </section>
    </>
  );
}

export default memo(VoluntariosSinAccesoTable);
