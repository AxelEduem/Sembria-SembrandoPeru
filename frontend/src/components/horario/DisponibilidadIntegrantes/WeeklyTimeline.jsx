import { CalendarDays, Clock3 } from "lucide-react";

import {
  TIMELINE_START,
  TIMELINE_END,
  TIMELINE_HOURS,
  getDayLabel,
  getDayShortLabel,
  getDurationLabel,
  minutesToTime,
} from "./disponibilidadUtils";
import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

/* ============================================================
   BLOQUE DEL TIMELINE – con ancho mínimo absoluto y mayor tamaño
   ============================================================ */

function TimelineBlock({ item, onSelect }) {
  const totalRange = TIMELINE_END - TIMELINE_START;
  const visibleStart = Math.max(item.start, TIMELINE_START);
  const visibleEnd = Math.min(item.end, TIMELINE_END);

  if (visibleStart >= visibleEnd) return null;

  let left = ((visibleStart - TIMELINE_START) / totalRange) * 100;
  let width = ((visibleEnd - visibleStart) / totalRange) * 100;

  // Aseguramos que el bloque tenga al menos 80px de ancho
  const minWidthPx = 80;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 animate-[blockIn_.4s_ease-out_both]"
      style={{
        left: `${Math.min(left, 100 - 0.5)}%`,
        width: `${Math.max(width, 0.5)}%`,
        height: "48px",
        minWidth: `${minWidthPx}px`,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect?.(item)}
        className="group relative flex h-full min-w-[80px] items-center overflow-hidden rounded-xl border-2 border-emerald-300 bg-emerald-100 px-3 text-left shadow-[0_3px_10px_rgba(16,185,129,0.12)] transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500 hover:bg-emerald-200 hover:shadow-lg"
      >
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-emerald-500" />

        <div className="min-w-0 flex-1 pl-3">
          <p className="truncate text-xs font-extrabold text-emerald-800">
            {minutesToTime(item.start)} – {minutesToTime(item.end)}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-bold text-emerald-600">
            {getDurationLabel(item.start, item.end)}
          </p>
        </div>

        {/* TOOLTIP */}
        <div className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-2 hidden -translate-x-1/2 rounded-lg bg-slate-800 px-4 py-2 text-[10px] font-semibold whitespace-nowrap text-white shadow-xl group-hover:block">
          <p>
            {item.dayLabel} · {minutesToTime(item.start)} – {minutesToTime(item.end)}
          </p>
          <p className="mt-0.5 text-[9px] font-medium text-slate-300">
            {getDurationLabel(item.start, item.end)} disponibles
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800" />
        </div>
      </button>
    </div>
  );
}

/* ============================================================
   TIMELINE – con filas más altas y tipografía más grande
   ============================================================ */

function WeeklyTimeline({ availability, onSelect }) {
  // Construir mapa con deduplicación adicional por día
  const fullMap = new Map();
  DIAS_SEMANA.forEach((day) => {
    const key = String(day.value);
    // Filtrar items del día y luego deduplicar por start-end
    const dayItems = availability
      .filter((item) => Number(item.day) === Number(day.value))
      .filter((item, index, self) => {
        // Eliminar duplicados exactos dentro del mismo día
        const firstIndex = self.findIndex(
          (other) => other.start === item.start && other.end === item.end,
        );
        return index === firstIndex;
      });

    fullMap.set(key, dayItems);
  });

  return (
    <div className="animate-[fadeUp_.4s_ease-out] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
      {/* HEADER */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-700">Timeline semanal</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Disponibilidad común de lunes a sábado.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Disponibilidad común
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div className="overflow-x-auto">
        <div className="min-w-[720px] px-5 pt-4 pb-3">
          {/* ENCABEZADO DE HORAS */}
          <div className="grid grid-cols-[120px_minmax(0,1fr)]">
            <div />
            <div className="relative h-7">
              {TIMELINE_HOURS.map((hour) => {
                const left = ((hour * 60 - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
                return (
                  <div
                    key={hour}
                    className="absolute top-0 -translate-x-1/2"
                    style={{ left: `${left}%` }}
                  >
                    <span className="text-[11px] font-bold text-slate-500">
                      {String(hour).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DÍAS */}
          <div className="divide-y divide-slate-100">
            {DIAS_SEMANA.map((day) => {
              const key = String(day.value);
              const dayItems = fullMap.get(key) || [];
              const hasAvailability = dayItems.length > 0;

              return (
                <div
                  key={day.value}
                  className={`grid grid-cols-[120px_minmax(0,1fr)] transition-colors duration-200 ${
                    hasAvailability ? "bg-white" : "bg-slate-50/30"
                  }`}
                >
                  {/* COLUMNA DEL DÍA */}
                  <div className="flex min-h-[80px] items-center gap-3 pr-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-extrabold uppercase ${
                        hasAvailability
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                          : "bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                      }`}
                    >
                      {getDayShortLabel(day.value)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-extrabold ${
                          hasAvailability ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {getDayLabel(day.value)}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] font-bold ${
                          hasAvailability ? "text-emerald-600" : "text-slate-400"
                        }`}
                      >
                        {hasAvailability
                          ? `${dayItems.length} ${dayItems.length === 1 ? "bloque" : "bloques"}`
                          : "Sin coincidencias"}
                      </p>
                    </div>
                  </div>

                  {/* TIMELINE DEL DÍA */}
                  <div className="relative min-h-[80px]">
                    {/* Líneas de hora (fondo) */}
                    {TIMELINE_HOURS.map((hour) => {
                      const left =
                        ((hour * 60 - TIMELINE_START) / (TIMELINE_END - TIMELINE_START)) * 100;
                      return (
                        <div
                          key={hour}
                          className="absolute top-0 bottom-0 w-px bg-slate-200"
                          style={{ left: `${left}%` }}
                        />
                      );
                    })}

                    {/* Línea central horizontal */}
                    <div className="absolute top-1/2 right-0 left-0 h-px bg-slate-200" />

                    {/* Bloques de disponibilidad */}
                    {hasAvailability ? (
                      dayItems.map((item) => (
                        <TimelineBlock key={item.id} item={item} onSelect={onSelect} />
                      ))
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-[11px] font-medium text-slate-400 shadow-sm">
                          Sin coincidencias
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-emerald-500" strokeWidth={1.8} />
          <p className="text-[10px] font-medium text-slate-500">
            Horario institucional: <span className="font-bold text-slate-600">08:00 – 18:00</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400">Todos disponibles</span>
        </div>
      </div>
    </div>
  );
}

export default WeeklyTimeline;
