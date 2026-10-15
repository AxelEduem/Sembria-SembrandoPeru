import { useState } from "react";
import { Building2, Users, CalendarRange, Table2 } from "lucide-react";
import { formatHours } from "@/services/integrantes-horarios/integrantesHorariosService";
import HorarioWeeklyGrid from "./HorarioWeeklyGrid";
import HorarioAreaTable from "./HorarioAreaTable";

function HorarioAreaView({
  areaOptions = [],
  areaFilter,
  emptyMessage,
  onAreaFilterChange,
  rows = [],
}) {
  const [viewType, setViewType] = useState("grid");

  const selectedArea =
    areaFilter === "todas"
      ? null
      : areaOptions.find((area) => String(area.id) === String(areaFilter)) || null;

  const volunteersCount = rows.filter((row) => row.tipo_integrante === "voluntario").length;
  const internsCount = rows.filter((row) => row.tipo_integrante === "practicante").length;
  const managersCount = rows.filter((row) => row.tipo_integrante === "gerente").length;
  const totalHours = rows.reduce((total, row) => total + Number(row.total_horas || 0), 0);

  return (
    <section className="space-y-4">
      {/* ENCABEZADO */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <p className="text-[10px] font-bold tracking-[0.1em] text-emerald-700 uppercase">
                Horario por área
              </p>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              {selectedArea?.nombre || "Selecciona un área"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Monitoreo semanal de voluntarios, practicantes y gerentes por área.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 lg:w-[300px] lg:justify-self-center">
            <div className="w-full">
              <label className="mb-1.5 block text-center text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
                Seleccionar área
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
                <select
                  value={areaFilter}
                  onChange={(event) => onAreaFilterChange?.(event.target.value)}
                  className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-9 pl-9 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="todas">Selecciona un área</option>
                  {areaOptions.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nombre}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
              </div>
            </div>

            <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewType("grid")}
                className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-all ${
                  viewType === "grid" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-white/70"
                }`}
              >
                <CalendarRange className="h-3.5 w-3.5" strokeWidth={1.8} />
                Semanal
              </button>
              <button
                type="button"
                onClick={() => setViewType("table")}
                className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition-all ${
                  viewType === "table" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-white/70"
                }`}
              >
                <Table2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                Tabla
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            <SummaryItem label="Voluntarios" value={volunteersCount} />
            <SummaryItem label="Practicantes" value={internsCount} />
            <SummaryItem label="Gerentes" value={managersCount} />
            <SummaryItem label="Horas" value={formatHours(totalHours)} />
          </div>
        </div>
      </div>

      {!selectedArea ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
            <Building2 className="h-5 w-5 text-emerald-700" strokeWidth={1.7} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Selecciona un área para visualizar el horario semanal.</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">
            Elige un área desde el selector superior para consultar la distribución de horarios.
          </p>
        </div>
      ) : rows.length ? (
        viewType === "grid" ? (
          <HorarioWeeklyGrid rows={rows} />
        ) : (
          <HorarioAreaTable rows={rows} />
        )
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50">
            <Users className="h-5 w-5 text-slate-300" strokeWidth={1.7} />
          </div>
          <p className="text-sm font-semibold text-slate-700">{emptyMessage}</p>
          <p className="mt-1 text-xs text-slate-400">No existen horarios registrados para esta área.</p>
        </div>
      )}
    </section>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="min-w-[92px] rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-center">
      <p className="text-[9px] font-bold tracking-[0.06em] text-slate-400 uppercase">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default HorarioAreaView;
