/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import FeedbackToast from "@/components/ui/FeedbackToast";
import { getMetricasAsistencia } from "@/services/asistencia/asistenciaService";

const COLORS = {
  emerald: "#059669",
  blue: "#2563EB",
  rose: "#E11D48",
  violet: "#7C3AED",
  cyan: "#0891B2",
  amber: "#D97706",
  slate: "#94A3B8",
};

const STATUS_COLORS = [
  COLORS.emerald,
  COLORS.rose,
  COLORS.violet,
  COLORS.cyan,
  COLORS.blue,
  COLORS.slate,
];

const tooltipStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: "12px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
  fontSize: "12px",
};

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function shift(value, days) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toHours(minutes) {
  return Math.round((Number(minutes || 0) / 60) * 10) / 10;
}

function ChartLoading() {
  return (
    <div className="flex h-72 items-end gap-4 px-8 pb-8" aria-label="Cargando gráfico">
      {[42, 68, 52, 82, 60].map((height, index) => (
        <div
          key={index}
          className="flex-1 animate-pulse rounded-t-xl bg-slate-100"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function ChartSection({ title, description, loading, children, className = "" }) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] ${className}`}
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="p-4 sm:p-5">{loading ? <ChartLoading /> : children}</div>
    </section>
  );
}

function EmptyChart({ message = "No hay datos disponibles para este periodo." }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
        <BarChart3 className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}

export default function AsistenciaMetricas() {
  const navigate = useNavigate();
  const period = useMemo(() => {
    const to = today();
    return { from: shift(to, -29), to };
  }, []);
  const [metrics, setMetrics] = useState({ por_area: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setMetrics(await getMetricasAsistencia(period.from, period.to));
    } catch (loadError) {
      setError(loadError?.message || "No se pudieron cargar las métricas de asistencia.");
    } finally {
      setLoading(false);
    }
  }, [period.from, period.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusData = useMemo(() => {
    const known =
      Number(metrics.completadas || 0) +
      Number(metrics.faltas || 0) +
      Number(metrics.justificadas || 0) +
      Number(metrics.permisos || 0) +
      Number(metrics.en_jornada || 0);
    const other = Math.max(0, Number(metrics.jornadas || 0) - known);

    return [
      { name: "Completadas", value: Number(metrics.completadas || 0) },
      { name: "Faltas", value: Number(metrics.faltas || 0) },
      { name: "Justificadas", value: Number(metrics.justificadas || 0) },
      { name: "Permisos", value: Number(metrics.permisos || 0) },
      { name: "En jornada", value: Number(metrics.en_jornada || 0) },
      { name: "Otros estados", value: other },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const coverageData = useMemo(
    () => [
      { name: "Integrantes", cantidad: Number(metrics.integrantes || 0) },
      { name: "Jornadas", cantidad: Number(metrics.jornadas || 0) },
    ],
    [metrics.integrantes, metrics.jornadas],
  );

  const timeData = useMemo(
    () => [
      { name: "Programadas", horas: toHours(metrics.minutos_programados) },
      { name: "Realizadas", horas: toHours(metrics.minutos_realizados) },
      { name: "Recuperadas", horas: toHours(metrics.minutos_recuperados) },
    ],
    [metrics.minutos_programados, metrics.minutos_realizados, metrics.minutos_recuperados],
  );

  const incidentData = useMemo(
    () => [
      { name: "Tardanzas", cantidad: Number(metrics.tardanzas || 0) },
      { name: "Salidas anticipadas", cantidad: Number(metrics.salidas_anticipadas || 0) },
      {
        name: "Recuperaciones pendientes",
        cantidad: Number(metrics.recuperaciones_pendientes || 0),
      },
    ],
    [metrics.recuperaciones_pendientes, metrics.salidas_anticipadas, metrics.tardanzas],
  );

  const areaData = metrics.por_area || [];
  const hasMetrics = Number(metrics.jornadas || 0) > 0;
  const openStatusDetail = (entry) => {
    const name = entry?.name || entry?.payload?.name;
    const status = {
      Completadas: "Completada",
      Faltas: "Falta",
      Justificadas: "Justificada",
      Permisos: "Permiso",
      "En jornada": "En jornada",
    }[name];
    navigate(`/asistencia/administracion${status ? `?estado=${encodeURIComponent(status)}` : ""}`);
  };
  const openIncidentDetail = (entry) => {
    const name = entry?.name || entry?.payload?.name;
    if (name === "Tardanzas") navigate("/asistencia/administracion?estado=Tardanza");
    else if (name === "Salidas anticipadas") navigate("/asistencia/administracion?estado=Salida%20anticipada");
    else navigate("/asistencia/administracion/solicitudes");
  };
  const openAreaDetail = (entry) => {
    const area = entry?.area || entry?.payload?.area;
    if (area) navigate(`/asistencia/administracion?area=${encodeURIComponent(area)}`);
  };

  return (
    <div className="module-page-enter space-y-5 pb-10">
      <FeedbackToast
        feedback={error ? { type: "error", message: error } : null}
        onClose={() => setError("")}
      />

      <button
        type="button"
        onClick={() => navigate("/asistencia/administracion")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a gestión de asistencia
      </button>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartSection
          title="Distribución de jornadas"
          description="Proporción de jornadas según su estado final o actual."
          loading={loading}
        >
          {statusData.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="46%"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={3}
                    strokeWidth={0}
                    className="cursor-pointer"
                    onClick={openStatusDetail}
                  >
                    {statusData.map((item, index) => (
                      <Cell key={item.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend verticalAlign="bottom" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartSection>

        <ChartSection
          title="Cobertura del periodo"
          description="Personas con registros y cantidad total de jornadas evaluadas."
          loading={loading}
        >
          {hasMetrics ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="cantidad" name="Cantidad" fill={COLORS.emerald} radius={[8, 8, 0, 0]} maxBarSize={90} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartSection>

        <ChartSection
          title="Balance de horas"
          description={`Cumplimiento general: ${Number(metrics.cumplimiento || 0)}%.`}
          loading={loading}
        >
          {hasMetrics ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis unit=" h" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} h`, "Horas"]} />
                  <Bar dataKey="horas" name="Horas" radius={[8, 8, 0, 0]} maxBarSize={72}>
                    <Cell fill={COLORS.slate} />
                    <Cell fill={COLORS.blue} />
                    <Cell fill={COLORS.emerald} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartSection>

        <ChartSection
          title="Incidencias operativas"
          description="Tardanzas, salidas anticipadas y recuperaciones que continúan pendientes."
          loading={loading}
        >
          {hasMetrics ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={incidentData}
                  layout="vertical"
                  margin={{ top: 10, right: 24, left: 24, bottom: 5 }}
                >
                  <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="cantidad" name="Casos" fill={COLORS.amber} radius={[0, 8, 8, 0]} maxBarSize={34} className="cursor-pointer" onClick={openIncidentDetail} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart />
          )}
        </ChartSection>
      </div>

      <ChartSection
        title="Resultados por área"
        description="Comparación de jornadas, completadas, faltas y justificaciones por área."
        loading={loading}
      >
        {areaData.length ? (
          <div style={{ height: `${Math.max(340, areaData.length * 56)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={areaData}
                layout="vertical"
                margin={{ top: 10, right: 28, left: 24, bottom: 12 }}
              >
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="area" width={130} tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" />
                <Bar dataKey="jornadas" name="Jornadas" fill={COLORS.slate} radius={[0, 5, 5, 0]} className="cursor-pointer" onClick={openAreaDetail} />
                <Bar dataKey="completadas" name="Completadas" fill={COLORS.emerald} radius={[0, 5, 5, 0]} className="cursor-pointer" onClick={openAreaDetail} />
                <Bar dataKey="faltas" name="Faltas" fill={COLORS.rose} radius={[0, 5, 5, 0]} className="cursor-pointer" onClick={openAreaDetail} />
                <Bar dataKey="justificadas" name="Justificadas" fill={COLORS.violet} radius={[0, 5, 5, 0]} className="cursor-pointer" onClick={openAreaDetail} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyChart message="No hay resultados por área en los últimos 30 días." />
        )}
      </ChartSection>
    </div>
  );
}
