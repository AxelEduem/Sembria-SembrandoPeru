import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  GraduationCap,
  RefreshCw,
  UserCheck,
  UserRoundX,
  Users,
} from "lucide-react";
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

import { IntegrantesProvider, useIntegrantesContext } from "@/contexts/IntegrantesContext";
import { buildIntegrantesMetrics } from "@/services/integrantes/metrics";

const COLORS = ["#2D5A3D", "#4A9D5F", "#D97706", "#2563EB", "#7C3AED", "#64748B"];

function MetricCard({ icon: Icon, label, value, hint, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{hint}</p>
    </article>
  );
}

function ChartCard({ title, description, children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] ${className}`}
    >
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

function MetricsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { integrantes, loading, error } = useIntegrantesContext();
  const metrics = useMemo(() => buildIntegrantesMetrics(integrantes), [integrantes]);
  const listSearch = location.state?.listSearch || "";

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-700" />
          <p className="mt-3 text-sm font-medium text-slate-600">Calculando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(`/integrantes${listSearch}`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a integrantes
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={Users}
          label="Total"
          value={metrics.total}
          hint="Integrantes registrados"
        />
        <MetricCard
          icon={UserCheck}
          label="Activos"
          value={metrics.active}
          hint={`${metrics.activeRate}% del total`}
          tone="blue"
        />
        <MetricCard
          icon={UserRoundX}
          label="Inactivos"
          value={metrics.inactive}
          hint="Participaciones cerradas"
          tone="slate"
        />
        <MetricCard
          icon={GraduationCap}
          label="Practicantes"
          value={metrics.practitioners}
          hint="Registros actuales"
          tone="violet"
        />
        <MetricCard
          icon={CalendarClock}
          label="Próximos a vencer"
          value={metrics.upcomingEndings}
          hint="Finalizan en 30 días"
          tone="amber"
        />
        <MetricCard
          icon={Activity}
          label="Horas de prácticas"
          value={metrics.practiceHours}
          hint={`Promedio: ${metrics.averagePracticeHours} h`}
        />
      </section>

      {!metrics.total ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            No hay integrantes para analizar.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Integrantes por tipo"
            description="Comparación entre voluntarios, practicantes y gerentes."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byType} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" name="Activos" fill="#2D5A3D" radius={[6, 6, 0, 0]} />
                <Bar dataKey="inactive" name="Inactivos" fill="#94A3B8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Estado de integrantes"
            description="Proporción actual de integrantes activos e inactivos."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.byStatus}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {metrics.byStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={["#2D5A3D", "#94A3B8"][index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Integrantes por área"
            description="Distribución de los perfiles actuales por equipo."
            className="xl:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byArea} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="total" name="Integrantes" fill="#2D5A3D" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Modalidad" description="Distribución por modalidad vigente.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.byModality}
                  dataKey="total"
                  nameKey="name"
                  outerRadius={92}
                  label
                >
                  {metrics.byModality.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Duración de periodos"
            description="Cantidad de integrantes por duración del periodo actual."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byPeriod}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Integrantes" fill="#4A9D5F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Registros recientes"
            description="Nuevos integrantes registrados durante los últimos seis meses."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar
                  dataKey="total"
                  name="Nuevos integrantes"
                  fill="#2563EB"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Ubicación"
            description="Principales departamentos declarados por los integrantes."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Integrantes" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}

export default function IntegrantesMetricsPage() {
  return (
    <IntegrantesProvider>
      <MetricsContent />
    </IntegrantesProvider>
  );
}
