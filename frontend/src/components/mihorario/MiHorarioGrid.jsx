import { useMemo } from "react";

const WEEK_DAYS = [
  { key: "Lunes", short: "LUN" },
  { key: "Martes", short: "MAR" },
  { key: "Miércoles", short: "MIÉ" },
  { key: "Jueves", short: "JUE" },
  { key: "Viernes", short: "VIE" },
  { key: "Sábado", short: "SÁB" },
];

const START_HOUR = 8;
const END_HOUR = 18;
const SLOT_MINUTES = 30;

const SLOT_HEIGHT = 48;
const TIME_WIDTH = 132;
const DAY_MIN_WIDTH = 150;

const normalizeDay = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim().toLowerCase();

  const map = {
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    miércoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    sábado: "Sábado",
    0: "Lunes",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
  };

  return map[raw] || null;
};

const timeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  const [hours, minutes] = String(time).split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
};

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const generateTimeSlots = () => {
  const slots = [];

  const start = START_HOUR * 60;
  const end = END_HOUR * 60;

  for (let minutes = start; minutes < end; minutes += SLOT_MINUTES) {
    slots.push({
      start: minutes,
      end: minutes + SLOT_MINUTES,
      label: `${formatTime(minutes)} - ${formatTime(minutes + SLOT_MINUTES)}`,
    });
  }

  return slots;
};

const TIME_SLOTS = generateTimeSlots();

const isSlotSelected = (schedule, slot) => {
  const start = timeToMinutes(schedule?.hora_inicio);
  const end = timeToMinutes(schedule?.hora_fin);

  if (start === null || end === null) {
    return false;
  }

  return slot.start >= start && slot.end <= end;
};

export default function MiHorarioGrid({ horarios = [] }) {
  const normalizedSchedules = useMemo(() => {
    if (!Array.isArray(horarios)) {
      return [];
    }

    return horarios
      .map((horario) => {
        const dia = normalizeDay(horario?.dia_semana ?? horario?.dia ?? horario?.day);

        if (!dia) {
          return null;
        }

        return {
          ...horario,
          dia_normalizado: dia,
        };
      })
      .filter(Boolean);
  }, [horarios]);

  const schedulesByDay = useMemo(() => {
    const grouped = {};

    WEEK_DAYS.forEach((day) => {
      grouped[day.key] = [];
    });

    normalizedSchedules.forEach((schedule) => {
      if (grouped[schedule.dia_normalizado]) {
        grouped[schedule.dia_normalizado].push(schedule);
      }
    });

    return grouped;
  }, [normalizedSchedules]);

  const totalHeight = TIME_SLOTS.length * SLOT_HEIGHT;

  return (
    <section className="w-full">
      <div className="w-full overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="w-full overflow-x-auto">
          <div
            className="min-w-[1050px]"
            style={{
              display: "grid",
              gridTemplateColumns: `${TIME_WIDTH}px repeat(${WEEK_DAYS.length}, minmax(${DAY_MIN_WIDTH}px, 1fr))`,
            }}
          >
            <div className="h-[76px] border-b border-slate-200 bg-slate-50/80" />

            {WEEK_DAYS.map((day) => (
              <div key={day.key} className="h-[76px] border-b border-l border-slate-200 bg-white">
                <div className="flex h-full flex-col items-center justify-center">
                  <span className="text-[10px] font-bold tracking-[0.16em] text-slate-400">
                    {day.short}
                  </span>

                  <span className="mt-1 text-[14px] font-semibold text-slate-800">{day.key}</span>
                </div>
              </div>
            ))}

            <div
              className="relative border-r border-slate-200 bg-slate-50/50"
              style={{
                height: totalHeight,
              }}
            >
              {TIME_SLOTS.map((slot, index) => (
                <div
                  key={slot.label}
                  className="absolute right-0 left-0 flex items-center justify-center"
                  style={{
                    top: index * SLOT_HEIGHT,
                    height: SLOT_HEIGHT,
                  }}
                >
                  <span className="text-[10px] font-medium tracking-[-0.01em] whitespace-nowrap text-slate-400">
                    {slot.label}
                  </span>
                </div>
              ))}

              {TIME_SLOTS.map((slot, index) => {
                const isWholeHour = slot.start % 60 === 0;

                return (
                  <div
                    key={`time-line-${slot.start}`}
                    className={`absolute right-0 left-0 border-t ${
                      isWholeHour ? "border-slate-200" : "border-slate-100"
                    }`}
                    style={{
                      top: index * SLOT_HEIGHT,
                    }}
                  />
                );
              })}

              <div className="absolute right-0 bottom-0 left-0 border-t border-slate-200" />
            </div>

            {WEEK_DAYS.map((day) => {
              const daySchedules = schedulesByDay[day.key] || [];

              return (
                <div
                  key={day.key}
                  className="relative border-l border-slate-200 bg-white"
                  style={{
                    height: totalHeight,
                  }}
                >
                  {TIME_SLOTS.map((slot, index) => {
                    const isWholeHour = slot.start % 60 === 0;

                    return (
                      <div
                        key={`${day.key}-${slot.start}`}
                        className={`absolute right-0 left-0 border-t ${
                          isWholeHour ? "border-slate-200" : "border-dashed border-slate-100"
                        }`}
                        style={{
                          top: index * SLOT_HEIGHT,
                        }}
                      />
                    );
                  })}

                  <div className="absolute right-0 bottom-0 left-0 border-t border-slate-200" />

                  {TIME_SLOTS.map((slot) => {
                    const selectedSchedule = daySchedules.find((schedule) =>
                      isSlotSelected(schedule, slot),
                    );

                    if (!selectedSchedule) {
                      return null;
                    }

                    const slotIndex = TIME_SLOTS.findIndex((item) => item.start === slot.start);

                    return (
                      <div
                        key={`${day.key}-${slot.label}`}
                        className="absolute right-[5px] left-[5px] z-10 rounded-[7px] bg-slate-800"
                        style={{
                          top: slotIndex * SLOT_HEIGHT + 3,
                          height: SLOT_HEIGHT - 6,
                        }}
                      >
                        <div className="absolute top-0 bottom-0 left-0 w-[3px] rounded-l-[7px] bg-slate-500" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full bg-slate-700" />

        <span className="text-[11px] font-medium text-slate-400">Horario registrado</span>
      </div>
    </section>
  );
}
