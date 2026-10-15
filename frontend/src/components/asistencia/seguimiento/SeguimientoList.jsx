import { ClipboardList, SearchX } from "lucide-react";

import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import SeguimientoRow from "./SeguimientoRow";

const PAGE_SIZE = 10;

export default function SeguimientoList({
  rows,
  loading,
  hasFilters,
  onClearFilters,
  onOpenDetail,
  currentPage = 1,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startRow = rows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(page * PAGE_SIZE, rows.length);

  return (
    <section className="module-section-enter module-enter-delay-3 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table
          className="w-full min-w-240 table-fixed border-collapse"
          loading={loading}
          loadingLabel="Cargando seguimiento..."
        >
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[28%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Integrante
              </th>
              <th className="w-[22%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Cargo y área
              </th>
              <th className="w-[16%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Horario
              </th>
              <th className="w-[17%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Marcación
              </th>
              <th className="w-[17%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">
                Estado
              </th>
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-t border-slate-100">
                    <td colSpan={5} className="px-5 py-3">
                      <div className="seguimiento-skeleton h-11 rounded-xl" />
                    </td>
                  </tr>
                ))
              : visible.map((row, index) => (
                  <SeguimientoRow
                    key={`${row.integrante_id}-${row.horario_id || "sin"}-${
                      row.asistencia_id || "sin"
                    }`}
                    row={row}
                    index={index}
                    onOpenDetail={onOpenDetail}
                  />
                ))}

            {!loading && !rows.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      {hasFilters ? (
                        <SearchX className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
                      ) : (
                        <ClipboardList
                          className="h-5 w-5 text-slate-400"
                          strokeWidth={1.8}
                        />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {hasFilters
                        ? "No hay resultados para estos filtros"
                        : "No hay jornadas programadas"}
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      {hasFilters
                        ? "Intenta modificar o limpiar los filtros aplicados."
                        : "No se encontraron registros para la fecha seleccionada."}
                    </p>
                    {hasFilters ? (
                      <button
                        type="button"
                        onClick={onClearFilters}
                        className="mt-3 text-xs font-bold text-emerald-700"
                      >
                        Limpiar filtros
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </Table>
      </div>

      {!loading && rows.length ? (
        <TablePagination
          currentPage={page}
          endRow={endRow}
          itemLabel="registros"
          onNext={() => onPageChange(Math.min(page + 1, totalPages))}
          onPrevious={() => onPageChange(Math.max(page - 1, 1))}
          pageSize={PAGE_SIZE}
          startRow={startRow}
          totalItems={rows.length}
          totalPages={totalPages}
        />
      ) : null}
    </section>
  );
}
