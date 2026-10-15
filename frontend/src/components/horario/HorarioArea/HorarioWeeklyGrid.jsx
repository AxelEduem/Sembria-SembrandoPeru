import { useMemo, useState } from "react";
import { Clock3, UsersRound } from "lucide-react";
import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

import { START_MINUTES, END_MINUTES, SLOT_MINUTES, SLOT_HEIGHT, TIME_COLUMN_WIDTH } from "./constants";
import { getGroupsForDay, assignLanes, getDayWidth, minutesToLabel } from "./utils";

import DaySelector from "./components/DaySelector";
import ScheduleGroup from "./components/ScheduleGroup";
import ScheduleDetail from "./components/ScheduleDetail";
import EmptyDay from "./components/EmptyDay";
import TimeColumn from "./components/TimeColumn";

export default function HorarioWeeklyGrid({ rows = [] }) {
  const [selectedDay, setSelectedDay] = useState(() => DIAS_SEMANA[0]?.value ?? 1);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const timeSlots = useMemo(
    () =>
      Array.from(
        { length: (END_MINUTES - START_MINUTES) / SLOT_MINUTES },
        (_, index) => {
          const start = START_MINUTES + index * SLOT_MINUTES;
          const end = start + SLOT_MINUTES;
          return {
            index,
            start,
            end,
            label: `${minutesToLabel(start)} - ${minutesToLabel(end)}`,
          };
        }
      ),
    []
  );

  const dayData = useMemo(
    () =>
      DIAS_SEMANA.map((day) => {
        const rawGroups = getGroupsForDay(rows, day.value);
        const groups = assignLanes(rawGroups);
        const peopleCount = new Set(groups.flatMap((group) => group.people.map((person) => person.id))).size;
        return {
          day,
          groups,
          peopleCount,
          width: getDayWidth(groups),
        };
      }),
    [rows]
  );

  const currentDay = dayData.find((item) => Number(item.day.value) === Number(selectedDay)) || dayData[0];
  const currentGroups = currentDay?.groups || [];
  const currentPeople = currentDay?.peopleCount || 0;
  const currentDayWidth = currentDay?.width || 600;
  const scheduleHeight = timeSlots.length * SLOT_HEIGHT;
  const totalPeople = rows.length;
  return (
    <>
      <style>{`
        @keyframes horario-card-enter {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes horario-day-enter {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <section className="w-full">
        {/* Encabezado */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.08em] text-slate-400 uppercase">Horario semanal</p>
            <p className="mt-1 text-xs text-slate-500">Consulta la programación por día y visualiza los horarios compartidos.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-medium text-slate-500 shadow-sm">
              <UsersRound className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />
              {totalPeople} {totalPeople === 1 ? "persona" : "personas"}
            </div>
          </div>
        </div>

        {/* Selector de días */}
        <DaySelector dayData={dayData} selectedDay={selectedDay} onSelectDay={setSelectedDay} />

        {/* Información del día seleccionado */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
            <Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} />
            08:00 — 18:00
          </div>
        </div>

        {/* Calendario de UN solo día */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.035)]">
          <div
            key={String(currentDay?.day.value)}
            className="min-w-max animate-[horario-day-enter_250ms_ease-out]"
            style={{ minWidth: `max(100%, ${TIME_COLUMN_WIDTH + currentDayWidth}px)` }}
          >
            {/* Cabecera */}
            <div
              className="grid border-b border-slate-200 bg-slate-50/80"
              style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px minmax(0, 1fr)` }}
            >
              <div className="flex h-[66px] items-center justify-center border-r border-slate-200">
                <span className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">Horario</span>
              </div>
              <div className="flex h-[66px] items-center justify-center">
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700">{currentDay?.day.label}</p>
                  <p className="mt-1 text-[9px] font-medium tracking-[0.08em] text-slate-400 uppercase">
                    {currentDay?.day.shortLabel}
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-medium text-slate-400">
                      {currentGroups.length} {currentGroups.length === 1 ? "horario" : "horarios"} · {currentPeople}{" "}
                      {currentPeople === 1 ? "persona" : "personas"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="grid" style={{ gridTemplateColumns: `${TIME_COLUMN_WIDTH}px minmax(0, 1fr)` }}>
              {/* Escala izquierda */}
              <TimeColumn timeSlots={timeSlots} />

              {/* Día seleccionado */}
              <div
                className="relative"
                style={{
                  height: `${scheduleHeight}px`,
                  minWidth: `${currentDayWidth}px`,
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0, transparent 43px, rgba(226,232,240,0.9) 43px, rgba(226,232,240,0.9) 44px)",
                }}
              >
                {currentGroups.length === 0 ? (
                  <EmptyDay />
                ) : (
                  currentGroups.map((group, index) => (
                    <ScheduleGroup key={group.id} group={group} index={index} onSelect={setSelectedGroup} />
                  ))
                )}
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded bg-emerald-200 ring-1 ring-emerald-100" />
                Horario compartido
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Practicante
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Voluntario
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[9px] text-slate-400">
                <span>Haz clic en un horario para ver todos sus integrantes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detalle */}
      <ScheduleDetail group={selectedGroup} onClose={() => setSelectedGroup(null)} />
    </>
  );
}
