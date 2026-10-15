import { CakeSlice, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

import logoSembrando from "@/assets/logo_sembrando.png";
import logoSembria from "@/assets/logo_sembria.webp";

import {
  getCalendarDays,
  getMonthDayKey,
  getMonthName,
} from "@/utils/cumpleanosUtils";

function CumpleanosCalendar({
  rows,
  calendarMonth,
  setCalendarMonth,
  loading = false,
}) {
  const days = getCalendarDays(calendarMonth);

  

  const lastCurrentMonthIndex = days.reduce(
    (lastIndex, day, index) =>
      day.currentMonth ? index : lastIndex,
    -1,
  );

  const weekCount =
    lastCurrentMonthIndex >= 0
      ? Math.ceil((lastCurrentMonthIndex + 1) / 7)
      : 6;

  const weeks = Array.from(
    { length: weekCount },
    (_, weekIndex) =>
      days.slice(
        weekIndex * 7,
        weekIndex * 7 + 7,
      ),
  );

  

  const goPreviousMonth = () => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1,
        ),
    );
  };

  const goNextMonth = () => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1,
        ),
    );
  };

  const goToday = () => {
    const today = new Date();

    setCalendarMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );
  };

  

  if (loading) {
    return (
      <section className="cumpleanos-print-area overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Calendario
            </p>

            <div className="mt-1 h-5 w-32 animate-pulse rounded bg-slate-200" />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100">
          {[
            "Dom",
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb",
          ].map((day) => (
            <div
              key={day}
              className="border-r border-slate-100 px-2 py-2 text-center text-[10px] font-bold tracking-[0.05em] text-slate-400 uppercase last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map(
            (_, index) => (
              <div
                key={index}
                className="min-h-[86px] border-r border-b border-slate-100 bg-white p-2 last:border-r-0"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
                </div>

                <div className="space-y-1">
                  <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ),
          )}
        </div>
      </section>
    );
  }

  

  return (
    <section className="cumpleanos-print-area overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">

      

      <div className="cumpleanos-print-header hidden">
        <div className="cumpleanos-print-logo-wrap">
          <img
            src={logoSembrando}
            alt="Logo institucional"
            className="cumpleanos-print-logo cumpleanos-print-logo-institution"
          />
        </div>

        <div className="cumpleanos-print-heading">
          <p className="cumpleanos-print-kicker">
            Sembrando Perú
          </p>

          <h1>
            CALENDARIO DE CUMPLEAÑOS
          </h1>

          <p className="cumpleanos-print-month">
            {getMonthName(
              calendarMonth.getMonth(),
            ).toLocaleUpperCase("es-PE")}{" "}
            {calendarMonth.getFullYear()}
          </p>
        </div>

        <div className="cumpleanos-print-logo-wrap cumpleanos-print-logo-system-wrap">
          <img
            src={logoSembria}
            alt="Logo del sistema"
            className="cumpleanos-print-logo cumpleanos-print-logo-system"
          />
        </div>
      </div>

      

      <div className="cumpleanos-screen-calendar-header flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            Calendario
          </p>

          <h2 className="mt-1 text-sm font-semibold text-slate-900 capitalize">
            {getMonthName(
              calendarMonth.getMonth(),
            )}{" "}
            {calendarMonth.getFullYear()}
          </h2>
        </div>

        <div className="cumpleanos-print-hidden flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToday}
            className="hidden sm:flex"
          >
            Hoy
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={goNextMonth}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      

      <div className="cumpleanos-calendar-weekdays grid grid-cols-7 border-b border-slate-100">
        {[
          "Dom",
          "Lun",
          "Mar",
          "Mié",
          "Jue",
          "Vie",
          "Sáb",
        ].map((day) => (
          <div
            key={day}
            className="border-r border-slate-100 px-2 py-2 text-center text-[10px] font-bold tracking-[0.05em] text-slate-400 uppercase last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      

      <div className="cumpleanos-calendar-weeks">
        {weeks.map((week, weekIndex) => (
          <div
            key={`week-${weekIndex}`}
            className="cumpleanos-calendar-week grid grid-cols-7"
            style={{
              animation: "cumpleanos-card-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both",
              animationDelay: `${weekIndex * 60}ms`,
            }}
          >
            {week.map(
              (
                { date, currentMonth },
                dayIndex,
              ) => {
                const dayRows = rows.filter(
                  (row) =>
                    getMonthDayKey(
                      row.cumpleanos,
                    ) ===
                    getMonthDayKey(date),
                );

                const today = new Date();

                const isToday =
                  today.getDate() ===
                    date.getDate() &&
                  today.getMonth() ===
                    date.getMonth() &&
                  today.getFullYear() ===
                    date.getFullYear();

                return (
                  <div
                    key={`${date.toISOString()}-${dayIndex}`}
                    className={`cumpleanos-calendar-day min-h-[86px] border-r border-b border-slate-100 p-2 transition-colors last:border-r-0 ${
                      currentMonth
                        ? "bg-white"
                        : "bg-slate-50/50"
                    }`}
                  >
                    

                    <div className="mb-1 flex items-center justify-between">
                      <span
                        className={`cumpleanos-day-number flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          isToday
                            ? "cumpleanos-day-number-today bg-rose-600 text-white"
                            : currentMonth
                              ? "text-slate-700"
                              : "text-slate-300"
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {dayRows.length > 0 ? (
                        <span className="cumpleanos-day-count text-[9px] font-bold text-rose-400">
                          {dayRows.length}
                        </span>
                      ) : null}
                    </div>

                    

                    <div className="cumpleanos-day-birthdays space-y-1">
                      {dayRows.map((row) => (
                        <div
                          key={row.id}
                          title={row.nombre}
                          className="cumpleanos-calendar-item flex items-start gap-1 rounded-md bg-rose-50 px-1.5 py-1 text-[9px] font-semibold text-rose-700"
                        >
                          <CakeSlice className="mt-[1px] h-2.5 w-2.5 shrink-0" />

                          <span className="cumpleanos-print-name min-w-0">
                            {row.nombre}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CumpleanosCalendar;
