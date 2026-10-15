import { Clock3 } from "lucide-react";
import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import { formatShortDate } from "@/utils/formatters";
import IntegranteStatusBadge from "@/components/integrantes/IntegranteStatusBadge";
import { Table } from "@/components/ui/table";

function TipoDesactivacionBadge({ tipo }) {
  if (!tipo) {
    return <span className="text-slate-400">-</span>;
  }

  const isManual = tipo === "manual";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isManual
          ? "border-amber-100 bg-amber-50 text-amber-700"
          : "border-sky-100 bg-sky-50 text-sky-700"
      }`}
    >
      {isManual ? "Manual" : "Automática"}
    </span>
  );
}

export default function HistoryTable() {
  const { history } = useIntegranteDetailContext();

  if (!history.length) {
    return (
      <div className="px-6 py-12 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
          <Clock3 className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">No hay historial disponible.</p>
        <p className="mt-1 text-xs text-slate-400">
          Los cambios realizados al integrante aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className="w-full min-w-[1160px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-50/70">
            {[
              "Tipo",
              "Periodo",
              "Área",
              "Cargo",
              "Inicio",
              "Fin",
              "Estado",
              "Tipo desactivación",
              "Desactivación",
              "Motivo",
              "Usuario",
            ].map((header) => (
              <th
                key={header}
                className="px-5 py-3.5 text-[11px] font-bold tracking-[0.08em] whitespace-nowrap text-slate-400 uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((item, index) => {
            const isActive = item.estado === "Activo";

            return (
              <tr
                key={item.id}
                style={{ animationDelay: `${260 + index * 55}ms` }}
                className="module-row-enter border-t border-slate-100 transition-colors hover:bg-slate-50/60"
              >
                <td className="px-5 py-4 font-medium text-slate-700">
                  {item.tipo_integrante === "practicante" ? "Practicante" : item.tipo_integrante === "gerente" ? "Gerente" : "Voluntario"}
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {item.tipo_integrante === "gerente" ? "Sin periodo" : `${item.periodo_meses || "-"} meses`}
                </td>
                <td className="px-5 py-4 text-slate-600">{item.area || "-"}</td>
                <td className="px-5 py-4 font-medium text-slate-600">{item.cargo || "-"}</td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                  {formatShortDate(item.fecha_inicio)}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                  {formatShortDate(item.fecha_fin)}
                </td>
                <td className="px-5 py-4">
                  <IntegranteStatusBadge active={isActive} />
                </td>
                <td className="px-5 py-4">
                  <TipoDesactivacionBadge tipo={item.tipo_desactivacion} />
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                  {formatShortDate(item.fecha_desactivacion)}
                </td>
                <td className="max-w-[220px] px-5 py-4 text-slate-500">
                  <span className="line-clamp-2">{item.motivo_desactivacion || "-"}</span>
                </td>
                <td className="px-5 py-4 text-slate-600">
                  {item.desactivado_por_nombre || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
