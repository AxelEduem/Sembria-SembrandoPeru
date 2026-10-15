import { memo, useMemo } from "react";

import { Search, SlidersHorizontal, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import TablePagination from "@/components/ui/TablePagination";
import { Input } from "@/components/ui/input";
import { Table } from "@/components/ui/table";

import { getAvatarUrl } from "@/utils/avatar";

const PAGE_SIZE = 5;

const selectClass = `
  h-10
  w-full
  cursor-pointer
  appearance-none
  rounded-xl
  border
  border-slate-200
  bg-white
  pr-8
  pl-9
  text-sm
  text-slate-700
  transition-all
  duration-200
  outline-none
  hover:border-slate-300
  hover:bg-slate-50/40
  focus:border-emerald-500
  focus:bg-white
  focus:ring-4
  focus:ring-emerald-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-50
  disabled:text-slate-400
  disabled:hover:border-slate-200
`;

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

function VoluntariosConAccesoTable({
  asignaciones,
  aplicaciones,
  accessSearch,
  accessAreaFilter,
  accessCargoFilter,
  accessTypeFilter = "todos",
  accessAppFilter,
  accessAreaOptions,
  accessCargoOptions,
  currentPage,
  pageSize = PAGE_SIZE,
  loading = false,
  saving,
  canRevoke,
  onSearchChange,
  onAreaChange,
  onCargoChange,
  onTypeChange,
  onAppChange,
  onPageChange,
  onRevoke,
}) {
  const totalPages = Math.max(Math.ceil(asignaciones.length / pageSize), 1);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedAsignaciones = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return asignaciones.slice(startIndex, startIndex + pageSize);
  }, [asignaciones, pageSize, safeCurrentPage]);

  const startRow = asignaciones.length ? (safeCurrentPage - 1) * pageSize + 1 : 0;

  const endRow = Math.min(safeCurrentPage * pageSize, asignaciones.length);

  /*
   * ================================================================
   * DETECTAR SI EXISTEN FILTROS
   *
   * Estado inicial esperado:
   *
   * search  = ""
   * area    = "todas"
   * cargo   = "todos"
   * tipo    = "todos"
   * app     = "todas"
   *
   * Resultado:
   *
   * hasFilters = false
   *
   * Por lo tanto el botón inicia DESACTIVADO.
   * ================================================================
   */
  const hasFilters =
    Boolean(accessSearch?.trim()) ||
    accessAreaFilter !== "todas" ||
    accessCargoFilter !== "todos" ||
    accessTypeFilter !== "todos" ||
    accessAppFilter !== "todas";

  function handleClearFilters() {
    if (!hasFilters) {
      return;
    }

    onSearchChange("");
    onAreaChange("todas");
    onCargoChange("todos");

    if (onTypeChange) {
      onTypeChange("todos");
    }

    onAppChange("todas");
  }

  return (
    <>
      {/* ============================================================
          ANIMACIONES
      ============================================================ */}
      <style>
        {`
          @keyframes accesosPanelEnter {
            0% {
              opacity: 0;
              transform: translateY(8px) scale(0.995);
              filter: blur(2px);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0);
            }
          }

          @keyframes accesosHeaderEnter {
            0% {
              opacity: 0;
              transform: translateY(-5px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes accesosFilterEnter {
            0% {
              opacity: 0;
              transform: translateY(5px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes accesosRowEnter {
            0% {
              opacity: 0;
              transform: translateY(5px);
            }

            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .accesos-panel-enter {
            animation:
              accesosPanelEnter
              520ms
              cubic-bezier(0.22, 1, 0.36, 1)
              both;
          }

          .accesos-header-enter {
            animation:
              accesosHeaderEnter
              420ms
              cubic-bezier(0.22, 1, 0.36, 1)
              80ms
              both;
          }

          .accesos-filter-enter {
            animation:
              accesosFilterEnter
              420ms
              cubic-bezier(0.22, 1, 0.36, 1)
              140ms
              both;
          }

          .accesos-table-enter {
            animation:
              accesosFilterEnter
              420ms
              cubic-bezier(0.22, 1, 0.36, 1)
              190ms
              both;
          }

          .accesos-row-enter {
            animation:
              accesosRowEnter
              360ms
              cubic-bezier(0.22, 1, 0.36, 1)
              both;
          }

          @media (prefers-reduced-motion: reduce) {
            .accesos-panel-enter,
            .accesos-header-enter,
            .accesos-filter-enter,
            .accesos-table-enter,
            .accesos-row-enter {
              animation: none;
            }
          }
        `}
      </style>

      <section className="accesos-filter-enter mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div>
          <div className="flex flex-col gap-3">
            {/* ========================================================
                FILA 1
            ======================================================== */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_repeat(3,minmax(180px,1fr))] lg:items-center">
              {/* BUSCAR */}
              <div className="relative w-full">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />

                <Input
                  value={accessSearch}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder="Buscar por nombre o correo..."
                  className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              {/* ÁREA */}
              <div className="relative w-full">
                <SlidersHorizontal
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />

                <select
                  value={accessAreaFilter}
                  onChange={(event) => {
                    onAreaChange(event.target.value);

                    onCargoChange("todos");
                  }}
                  className={selectClass}
                >
                  <option value="todas">Selecciona un área</option>

                  {accessAreaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* CARGO */}
              <div className="relative w-full">
                <SlidersHorizontal
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />

                <select
                  value={accessCargoFilter}
                  onChange={(event) => onCargoChange(event.target.value)}
                  disabled={accessAreaFilter === "todas"}
                  className={selectClass}
                >
                  <option value="todos">
                    {accessAreaFilter === "todas"
                      ? "Selecciona un área primero"
                      : "Selecciona un cargo"}
                  </option>

                  {accessCargoOptions.map((cargo) => (
                    <option key={cargo} value={cargo}>
                      {cargo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative w-full">
                <SlidersHorizontal
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />
                <select
                  value={accessTypeFilter}
                  onChange={(event) => onTypeChange?.(event.target.value)}
                  className={selectClass}
                >
                  <option value="todos">Selecciona un tipo</option>
                  <option value="voluntario">Voluntario</option>
                  <option value="practicante">Practicante</option>
                  <option value="gerente">Gerente</option>
                </select>
              </div>
            </div>

            {/* ========================================================
                FILA 2
            ======================================================== */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_1fr_1fr_auto] lg:items-center">
              {/* APLICACIÓN */}
              <div className="relative w-full">
                <SlidersHorizontal
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.8}
                />

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

              {/* ESPACIO */}
              <div className="hidden lg:block" />
              <div className="hidden lg:block" />

              {/* LIMPIAR */}
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                disabled={!hasFilters}
                className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-all duration-200 lg:w-auto ${
                  hasFilters
                    ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-sm"
                    : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                }`}
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="accesos-panel-enter overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="accesos-table-enter overflow-x-auto">
          <Table
            className="w-full min-w-[900px] border-collapse"
            loading={loading}
            loadingLabel="Cargando accesos..."
          >
            <thead>
              <tr className="bg-slate-50/70">
                {[
                  "Integrante",
                  "Tipo",
                  "Area",
                  "Cargo",
                  "Aplicacion",
                  ...(canRevoke ? ["Acciones"] : []),
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
              {paginatedAsignaciones.map((asignacion, index) => {
                const integrante = asignacion.integrante || asignacion.voluntario || {};
                const avatarUrl =
                  getAvatarUrl(integrante.avatar_url) || getAvatarUrl(integrante.avatar_path);

                return (
                  <tr
                    key={asignacion.id}
                    className="accesos-row-enter border-t border-slate-100 hover:bg-slate-50/60"
                    style={{
                      animationDelay: `${260 + index * 55}ms`,
                    }}
                  >
                    {/* INTEGRANTE */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {avatarUrl ? (
                          <EnlargeablePhoto
                            src={avatarUrl}
                            fallbackSrc={getAvatarUrl(integrante.avatar_path)}
                            alt={`Foto de ${integrante.nombre}`}
                            className="h-9 w-9 rounded-lg border border-emerald-100 bg-emerald-50"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700">
                            {getInitials(integrante.nombre)}
                          </div>
                        )}

                        <span className="font-semibold text-slate-800">{integrante.nombre}</span>
                      </div>
                    </td>

                    {/* TIPO */}
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {getTipoLabel(integrante.tipo_integrante)}
                    </td>

                    {/* ÁREA */}
                    <td className="px-5 py-4 text-sm text-slate-500">{integrante.area}</td>

                    {/* CARGO */}
                    <td className="px-5 py-4 text-sm text-slate-500">{integrante.cargo}</td>

                    {/* APLICACIÓN */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {asignacion.aplicacion?.nombre || "Aplicacion"}
                      </span>
                    </td>

                    {/* ACCIONES */}
                    {canRevoke && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onRevoke(asignacion)}
                            disabled={saving}
                            className="h-8 gap-1.5 rounded-lg px-2.5 text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />

                            <span className="text-xs font-medium">Quitar</span>
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* SIN RESULTADOS */}
              {asignaciones.length === 0 && (
                <tr>
                  <td
                    colSpan={canRevoke ? 6 : 5}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    {loading
                      ? "Filtrando accesos..."
                      : "No encontramos integrantes con acceso para esos filtros."}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* ============================================================
            PAGINACIÓN
        ============================================================ */}
        <div className="accesos-filter-enter">
          <TablePagination
            currentPage={safeCurrentPage}
            endRow={endRow}
            itemLabel="asignaciones"
            onNext={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
            onPrevious={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            pageSize={pageSize}
            startRow={startRow}
            totalItems={asignaciones.length}
            totalPages={totalPages}
          />
        </div>
      </section>
    </>
  );
}

export default memo(VoluntariosConAccesoTable);
