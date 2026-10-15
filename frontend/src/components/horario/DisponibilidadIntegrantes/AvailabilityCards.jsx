import { CalendarDays, Clock3 } from "lucide-react";

import { getDurationLabel, minutesToTime } from "./disponibilidadUtils";

function AvailabilityCards({ availability, onSelect }) {
  if (!availability.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
        <div className="max-w-sm">
          <p className="text-base font-extrabold text-slate-700">No hay horarios en común</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Las personas seleccionadas no comparten ningún bloque disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availability.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item)}
          style={{
            animation: "fadeUp 350ms cubic-bezier(0.22, 1, 0.36, 1) both",
            animationDelay: `${index * 60}ms`,
          }}
          className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-slate-700">{item.dayLabel}</p>

            <div className="mt-1 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
                <span className="text-sm font-medium text-slate-600">
                  {minutesToTime(item.start)} – {minutesToTime(item.end)}
                </span>
              </div>

              <span className="text-slate-300">•</span>

              <span className="text-sm font-semibold text-emerald-600">
                {getDurationLabel(item.start, item.end)}
              </span>
            </div>
          </div>

          <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[9px] font-extrabold text-white uppercase shadow-sm">
            Elegir
          </span>
        </button>
      ))}
    </div>
  );
}

export default AvailabilityCards;
