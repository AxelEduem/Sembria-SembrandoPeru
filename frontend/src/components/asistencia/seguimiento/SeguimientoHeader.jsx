import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Radio,
} from "lucide-react";

function formatLongDate(value) {
  if (!value) return "";

  const [year, month, day] = String(value)
    .split("-")
    .map(Number);

  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

function SeguimientoHeader({
  date,
  realtimeStatus = "connecting",
  onPrevious,
  onToday,
  onNext,
  onDateChange,
}) {
  return (
    <section
      className="
        seguimiento-section-enter
        relative
        overflow-hidden
        rounded-[26px]
        border
        border-slate-200
        bg-white
        shadow-[0_8px_30px_rgba(15,23,42,0.045)]
      "
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-28 h-64 w-64 rounded-full bg-emerald-50/70 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-slate-50 blur-3xl" />
      </div>

      <div className="relative z-10 px-5 py-6 sm:px-7 sm:py-7 lg:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-emerald-100
                  bg-emerald-50
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.1em]
                  text-emerald-700
                "
              >
                <Eye className="h-3.5 w-3.5" />
                Monitoreo operativo
              </span>

              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-slate-200
                  bg-slate-50
                  px-3
                  py-1.5
                  text-[10px]
                  font-semibold
                  text-slate-500
                "
              >
                <span
                  className={`
                    h-1.5
                    w-1.5
                    rounded-full
                    ${
                      realtimeStatus === "synced"
                        ? "bg-emerald-500 seguimiento-live-dot"
                        : "bg-amber-500"
                    }
                  `}
                />
                {realtimeStatus === "synced"
                  ? "Datos sincronizados"
                  : "Reconectando"}
              </span>
            </div>

            <h1
              className="
                mt-4
                text-2xl
                font-extrabold
                tracking-tight
                text-slate-900
                sm:text-3xl
              "
            >
              Seguimiento de jornadas
            </h1>

            <p
              className="
                mt-1.5
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
              "
            >
              Supervisa el estado de los bloques programados y detecta
              rápidamente las jornadas que requieren atención.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div
              className="
                flex
                items-center
                rounded-xl
                border
                border-slate-200
                bg-slate-50/70
                p-1
              "
            >
              <button
                type="button"
                onClick={onPrevious}
                aria-label="Fecha anterior"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  hover:bg-white
                  hover:text-slate-800
                "
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onToday}
                className="
                  h-9
                  rounded-lg
                  px-3
                  text-[10px]
                  font-bold
                  tracking-[0.08em]
                  text-slate-700
                  transition
                  hover:bg-white
                "
              >
                HOY
              </button>

              <button
                type="button"
                onClick={onNext}
                aria-label="Fecha siguiente"
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-500
                  transition
                  hover:bg-white
                  hover:text-slate-800
                "
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <label
              className="
                flex
                h-11
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                shadow-sm
              "
            >
              <CalendarDays className="h-4 w-4 shrink-0 text-emerald-600" />

              <input
                type="date"
                value={date}
                onChange={(event) => onDateChange(event.target.value)}
                className="
                  min-w-0
                  bg-transparent
                  text-xs
                  font-semibold
                  text-slate-700
                  outline-none
                "
              />
            </label>
          </div>
        </div>

        <div
          className="
            mt-5
            flex
            flex-wrap
            items-center
            gap-x-5
            gap-y-2
            border-t
            border-slate-100
            pt-4
          "
        >
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-600" />

            <span className="text-[10px] font-medium text-slate-400">
              Actualización en tiempo real
            </span>
          </div>

          <span className="text-[10px] text-slate-300">•</span>

          <span className="text-[10px] font-medium capitalize text-slate-400">
            {formatLongDate(date)}
          </span>
        </div>
      </div>
    </section>
  );
}

export default SeguimientoHeader;