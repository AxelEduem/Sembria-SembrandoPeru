import { CalendarDays } from "lucide-react";
import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import { formatShortDate } from "@/utils/formatters";
import PeriodBox from "./PeriodBox";

export default function PeriodSection() {
  const { currentHistory, row } = useIntegranteDetailContext();

  if (!row) return null;

  const isGerente = currentHistory?.tipo_integrante === "gerente";

  const periodMonths = currentHistory?.periodo_meses || row.periodo_meses || "-";
  const fechaInicio = currentHistory?.fecha_inicio || row.fecha_inicio;
  const fechaFin = currentHistory?.fecha_fin || row.fecha_fin;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
          <CalendarDays className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            {isGerente ? "Fecha de inicio" : "Periodo de participación"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isGerente
              ? "Fecha desde la cual el gerente forma parte de la organización."
              : "Duración registrada para el integrante."}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <PeriodBox label="Fecha de inicio" value={formatShortDate(fechaInicio)} />

        {!isGerente && (
          <>
            <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-full border border-slate-200 bg-white text-slate-400">
              →
            </div>
            <div className="hidden h-px flex-1 bg-slate-200 sm:block" />
            <PeriodBox label="Fecha de fin" value={formatShortDate(fechaFin)} />
          </>
        )}

        <div className="sm:ml-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-[10px] font-bold tracking-[0.08em] text-emerald-600 uppercase">
              Duración
            </p>
            <p className="mt-0.5 text-sm font-bold text-emerald-800">
              {isGerente ? "Indefinido" : `${periodMonths} meses`}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}