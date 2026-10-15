/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AttendanceCalendar from "@/components/asistencia/AttendanceCalendar";
import { getCalendarioAsistencia, getMiHistorial } from "@/services/asistencia/asistenciaService";

export default function AsistenciaHistorial() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Lima",
      year: "numeric",
      month: "2-digit",
    })
      .format(new Date())
      .slice(0, 7),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [year, month] = calendarMonth.split("-").map(Number);
      const from = `${calendarMonth}-01`;
      const to = `${calendarMonth}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
      const [attendanceHistory, calendarHolidays] = await Promise.all([
        getMiHistorial(),
        getCalendarioAsistencia(from, to),
      ]);
      setHistory(attendanceHistory);
      setHolidays(calendarHolidays);
    } catch (loadError) {
      setError(loadError?.message || "No se pudo cargar tu calendario de asistencia.");
      setHistory([]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate("/asistencia")}
        className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a mi asistencia
      </button>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void load()} className="font-bold underline">
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500 shadow-sm">
          Cargando calendario...
        </div>
      ) : (
        <AttendanceCalendar
          history={history}
          holidays={holidays}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
        />
      )}
    </div>
  );
}
