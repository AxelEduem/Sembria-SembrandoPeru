import { ChevronLeft, ChevronRight } from "lucide-react";

const COLORS = {
  completada: "border-emerald-200 bg-emerald-50 text-emerald-800",
  en_jornada: "border-blue-200 bg-blue-50 text-blue-800",
  jornada_abierta: "border-blue-200 bg-blue-50 text-blue-800",
  falta: "border-rose-200 bg-rose-50 text-rose-800",
  justificada: "border-violet-200 bg-violet-50 text-violet-800",
  permiso: "border-cyan-200 bg-cyan-50 text-cyan-800",
  anulada: "border-slate-200 bg-slate-50 text-slate-600",
};

const STATUS_LABELS = {
  completada: "Completada",
  en_jornada: "En jornada",
  jornada_abierta: "Jornada abierta",
  falta: "Falta",
  justificada: "Justificada",
  permiso: "Permiso",
  anulada: "Anulada por feriado",
  pendiente: "Pendiente",
};

function formatDate(value) {
  const [year, month, day] = String(value || "")
    .slice(0, 10)
    .split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Fecha no disponible";
}

function formatTime(value) {
  return value ? String(value).slice(0, 5) : "--:--";
}

export default function AttendanceCalendar({ history, holidays = [], month, onMonthChange }) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const days = new Date(year, monthNumber, 0).getDate();
  const byDate = history.reduce(
    (result, item) => ({
      ...result,
      [String(item.fecha).slice(0, 10)]: [...(result[String(item.fecha).slice(0, 10)] || []), item],
    }),
    {},
  );
  const holidaysByDate = Object.fromEntries(
    holidays.map((holiday) => [String(holiday.fecha).slice(0, 10), holiday]),
  );

  function shift(value) {
    const date = new Date(year, monthNumber - 1 + value, 1);
    onMonthChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  const label = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1),
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => shift(-1)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Calendario personal
          </p>
          <h1 className="mt-1 text-sm font-extrabold text-slate-900 capitalize">{label}</h1>
        </div>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => shift(1)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-[9px] font-bold text-slate-400 uppercase">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <span key={day} className="py-2">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="min-h-28 border-r border-b border-slate-100 bg-slate-50/30"
              />
            ))}
            {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
              const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const records = byDate[date] || [];
              const holiday = holidaysByDate[date];

              return (
                <div key={date} className="min-h-28 border-r border-b border-slate-100 p-1.5">
                  <span className="text-[10px] font-bold text-slate-500">{day}</span>
                  <div className="mt-1 space-y-1.5">
                    {holiday ? (
                      <div
                        title={`${holiday.nombre}${holiday.norma ? ` · ${holiday.norma}` : ""}`}
                        className={`rounded-lg border px-2 py-1.5 text-[9px] leading-4 ${holiday.requiere_asistencia ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
                      >
                        <p className="font-bold">{holiday.nombre}</p>
                        <p className="font-semibold">
                          {holiday.requiere_asistencia ? "Feriado laborable" : "Sin asistencia"}
                        </p>
                      </div>
                    ) : null}
                    {records.map((item) => {
                      const state =
                        STATUS_LABELS[item.estado] || String(item.estado || "Pendiente");
                      const start = formatTime(item.hora_inicio_programada);
                      const end = formatTime(item.hora_fin_programada);

                      return (
                        <div
                          key={item.id}
                          title={`${formatDate(item.fecha)} · ${start}–${end} · ${state}`}
                          className={`rounded-lg border px-2 py-1.5 text-[9px] leading-4 ${COLORS[item.estado] || "border-amber-200 bg-amber-50 text-amber-800"}`}
                        >
                          <p className="font-bold">
                            {start} – {end}
                          </p>
                          <p className="font-semibold">{state}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-5 py-3 text-[9px] text-slate-500">
        {[
          ["bg-emerald-400", "Completada"],
          ["bg-blue-400", "En jornada"],
          ["bg-rose-400", "Falta"],
          ["bg-violet-400", "Justificada"],
          ["bg-cyan-400", "Permiso"],
          ["bg-amber-400", "Pendiente"],
          ["bg-slate-400", "Anulada por feriado"],
        ].map(([color, text]) => (
          <span key={text} className="flex items-center gap-1">
            <i className={`h-2 w-2 rounded-full ${color}`} />
            {text}
          </span>
        ))}
      </div>
    </section>
  );
}
