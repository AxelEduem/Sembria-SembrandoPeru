import { CalendarClock, Eye, FileSearch, Mail, ScrollText, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import TablePagination from "@/components/ui/TablePagination";
import { Table } from "@/components/ui/table";
import { getAvatarUrl } from "@/utils/avatar";

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function BitacoraTable({ records, meta, onPageChange, onView }) {
  return (
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-280 table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/70">
              <th className="w-[16%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Fecha</th>
              <th className="w-[22%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Responsable</th>
              <th className="w-[16%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Módulo / acción</th>
              <th className="w-[25%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Descripción</th>
              <th className="w-[12%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Entidad</th>
              <th className="w-[10%] px-5 py-3.5 text-left text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Resultado</th>
              <th className="w-[9%] px-5 py-3.5 text-center text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => {
              const avatarUrl =
                getAvatarUrl(record.actor?.avatar_url) || getAvatarUrl(record.actor?.avatar_path);

              return (
              <tr key={record.id} style={{ animationDelay: `${260 + index * 55}ms` }} className="module-row-enter group border-t border-slate-100 transition-colors duration-150 hover:bg-slate-50/60">
                <td className="px-5 py-4 align-middle"><p className="flex items-center gap-2 text-xs font-medium whitespace-nowrap text-slate-600"><CalendarClock className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />{formatDate(record.fecha)}</p></td>
                <td className="px-5 py-4 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    {avatarUrl ? (
                      <EnlargeablePhoto
                        src={avatarUrl}
                        fallbackSrc={getAvatarUrl(record.actor?.avatar_path)}
                        alt={`Foto de ${record.actor?.nombre || "responsable"}`}
                        className="h-9 w-9 rounded-lg border border-emerald-100"
                      />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700 group-hover:bg-emerald-100">{initials(record.actor?.nombre) || <UserRound className="h-4 w-4" />}</div>
                    )}
                    <div className="min-w-0"><p className="line-clamp-2 text-sm leading-5 font-semibold wrap-break-word text-slate-800">{record.actor?.nombre || "—"}</p><p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3 w-3 shrink-0" /><span className="max-w-44 truncate">{record.actor?.correo || "—"}</span></p></div>
                  </div>
                </td>
                <td className="px-5 py-4 align-middle"><p className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-700"><ScrollText className="h-4 w-4 shrink-0 text-emerald-600" />{record.modulo?.replaceAll("_", " ")}</p><p className="mt-1 pl-6 text-xs capitalize text-slate-400">{record.accion?.replaceAll("_", " ")}</p></td>
                <td className="px-5 py-4 align-middle"><p className="line-clamp-2 text-sm leading-5 wrap-break-word text-slate-600" title={record.descripcion}>{record.descripcion}</p></td>
                <td className="px-5 py-4 align-middle">
                  {record.entidad?.tipo ? (
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-xs font-semibold wrap-break-word text-slate-600">
                        {record.entidad.nombre || record.entidad.tipo.replaceAll("_", " ")}
                      </p>
                      {record.entidad.id && (
                        <p className="mt-0.5 text-[11px] text-slate-400">ID #{record.entidad.id}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4 align-middle"><span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${record.resultado === "exitoso" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-red-100 bg-red-50 text-red-700"}`}>{record.resultado === "exitoso" ? "Exitoso" : "Error"}</span></td>
                <td className="px-5 py-4 text-center align-middle"><Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700" aria-label={`Ver detalle del evento ${record.id}`} onClick={() => onView(record)}><Eye className="h-4 w-4" strokeWidth={1.8} /></Button></td>
              </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      {records.length === 0 && <div className="flex flex-col items-center px-6 py-14 text-center"><FileSearch className="mb-3 h-9 w-9 text-slate-300" /><p className="font-semibold text-slate-700">No hay eventos para mostrar</p><p className="mt-1 text-sm text-slate-400">Prueba cambiando los filtros de consulta.</p></div>}
      {records.length > 0 && <TablePagination currentPage={meta.current_page} totalPages={meta.last_page} totalItems={meta.total} startRow={meta.from} endRow={meta.to} itemLabel="eventos" onPrevious={() => onPageChange(meta.current_page - 1)} onNext={() => onPageChange(meta.current_page + 1)} />}
    </section>
  );
}
