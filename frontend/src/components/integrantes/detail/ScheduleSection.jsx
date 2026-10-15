import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";

import { useIntegranteDetailContext } from "@/contexts/IntegranteDetailContext";
import { useAuth } from "@/contexts/AuthContext";
import { DAYS } from "@/constants/daysConstants";
import { calculateWeeklyHours } from "@/services/integrantes-horarios/integrantesHorariosService";
import {
  getIntegranteAsistenciaTotal,
  getMiAsistenciaTotal,
} from "@/services/asistencia/integrantestats";

function timeToMinutes(time) {
  if (!time || typeof time !== "string") return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  return hours * 60 + minutes;
}

function parseDateOnly(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const dateStr = String(value).split("T")[0];
  const [year, month, day] = dateStr.split("-").map(Number);

  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculatePeriodHours(blocks, fechaInicio, fechaFin) {
  const start = parseDateOnly(fechaInicio);
  const end = parseDateOnly(fechaFin);

  if (!start || !end || end < start || !blocks?.length) return 0;

  let totalHours = 0;
  let current = new Date(start);

  while (current <= end) {
    const jsDay = current.getDay();
    const diaSemana = jsDay === 0 ? 7 : jsDay;
    const blocksForDay = blocks.filter((block) => Number(block.dia_semana) === Number(diaSemana));

    blocksForDay.forEach((block) => {
      const startMinutes = timeToMinutes(block.hora_inicio);
      const endMinutes = timeToMinutes(block.hora_fin);
      if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) return;
      totalHours += (endMinutes - startMinutes) / 60;
    });

    current = addDays(current, 1);
  }

  return Math.round(totalHours * 100) / 100;
}

function formatHours(hours) {
  const value = Math.round(Number(hours || 0) * 100) / 100;
  if (Number.isInteger(value)) {
    return `${value} ${value === 1 ? "hora" : "horas"}`;
  }
  return `${value.toFixed(2).replace(/\.?0+$/, "")} horas`;
}

function getEffectiveEndDate(historial) {
  if (historial?.fecha_fin) return historial.fecha_fin;

  if (historial?.fecha_inicio && historial?.periodo_meses) {
    const start = parseDateOnly(historial.fecha_inicio);
    if (start) {
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(historial.periodo_meses));
      return end;
    }
  }

  return null;
}

export default function ScheduleSection({ personal = false }) {
  const { horarios = [], row, currentHistory } = useIntegranteDetailContext();
  const { profile } = useAuth();
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";

  const [totalAttendanceHours, setTotalAttendanceHours] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const attendanceRequest = personal
      ? getMiAsistenciaTotal({ cacheScope })
      : getIntegranteAsistenciaTotal(row.id, { cacheScope });

    attendanceRequest
      .then((hours) => {
        if (!cancelled) setTotalAttendanceHours(hours);
      })
      .catch(() => {
        if (!cancelled) setTotalAttendanceHours(0);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheScope, personal, row?.id]);

  const weeklyHours = useMemo(
    () => (calculateWeeklyHours ? calculateWeeklyHours(horarios) : 0),
    [horarios],
  );

  const periodHours = useMemo(() => {
    const end = getEffectiveEndDate(currentHistory);
    return calculatePeriodHours(horarios, currentHistory?.fecha_inicio, end);
  }, [currentHistory, horarios]);

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50">
                <Clock3 className="h-5 w-5 text-emerald-700" strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-base font-semibold text-slate-900">Horario</h2>
                <p className="mt-1 text-sm text-slate-500">Horario registrado del integrante.</p>
              </div>
            </div>
          </div>

          {/* Fila 2: Métricas */}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <StatCard label="Horas semanales" value={formatHours(weeklyHours)} />
            <StatCard label="Horas del período" value={formatHours(periodHours)} />
            <StatCard label="Horas cumplidas" value={formatHours(totalAttendanceHours)} />
          </div>
        </div>

        <div className="p-6">
          {horarios.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {horarios.map((item) => (
                <div
                  key={item.id || `${item.dia_semana}-${item.hora_inicio}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm">
                      {DAYS[item.dia_semana]?.slice(0, 2).toUpperCase() || "--"}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {DAYS[item.dia_semana] || "-"}
                    </span>
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap text-slate-500">
                    {item.hora_inicio} - {item.hora_fin}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <Clock3 className="mx-auto h-6 w-6 text-slate-300" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-medium text-slate-600">No hay horario registrado.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}
