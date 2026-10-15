import { useMemo, useState } from "react";

import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

const PAGE_SIZE = 10;

function formatTime12(time) {
  if (!time) return "-";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function HorarioAreaTable({ rows }) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [rows, safeCurrentPage]);

  const startRow = rows.length ? (safeCurrentPage - 1) * PAGE_SIZE + 1 : 0;
  const endRow = Math.min(safeCurrentPage * PAGE_SIZE, rows.length);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[1100px] table-fixed border-collapse">
          <colgroup>
            <col style={{ width: "22%" }} />
            <col style={{ width: "16%" }} />
            {DIAS_SEMANA.map((day) => (
              <col key={day.value} style={{ width: "10%" }} />
            ))}
          </colgroup>

          <thead>
            <tr className="bg-slate-50/70">
              <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Nombre
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Cargo
              </th>
              {DIAS_SEMANA.map((day) => (
                <th
                  key={day.value}
                  className="px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase"
                >
                  {day.shortLabel}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className="group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60"
              >
                <td className="px-5 py-4 align-middle">
                  <p className="truncate text-sm font-semibold text-slate-800" title={row.nombre}>
                    {row.nombre || "Sin nombre"}
                  </p>
                </td>
                <td className="px-5 py-4 align-middle">
                  <p className="truncate text-sm text-slate-600" title={row.cargo}>
                    {row.cargo || "Sin cargo"}
                  </p>
                </td>

                {DIAS_SEMANA.map((day) => {
                  const schedules = (row.horarios || []).filter(
                    (block) => Number(block.dia_semana) === Number(day.value),
                  );

                  const times = schedules.map(
                    (block) =>
                      `${formatTime12(block.hora_inicio)} - ${formatTime12(block.hora_fin)}`,
                  );

                  return (
                    <td key={day.value} className="px-5 py-4 text-center align-middle">
                      {times.length ? (
                        <span className="text-xs leading-5 text-slate-600">{times.join(", ")}</span>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + DIAS_SEMANA.length} className="px-6 py-14">
                  <div className="flex flex-col items-center justify-center text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      No hay integrantes en esta área
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      Selecciona otra área o registra nuevos integrantes.
                    </p>
                  </div>
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
        onNext={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
        pageSize={PAGE_SIZE}
        startRow={startRow}
        totalItems={rows.length}
        totalPages={totalPages}
      />
    </section>
  );
}

export default HorarioAreaTable;
