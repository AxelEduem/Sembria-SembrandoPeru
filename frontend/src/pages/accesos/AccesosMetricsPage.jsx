import { useMemo } from "react";
import {
  ArrowLeft,
  Gauge,
  KeyRound,
  Layers3,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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

import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import { useAuth } from "@/contexts/AuthContext";
import useDashboard from "@/hooks/useDashboard";
import { buildAccessMetrics } from "@/services/integrantes-accesos/metrics";

function MetricCard({ icon: Icon, label, value, hint, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    red: "border-red-100 bg-red-50 text-red-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
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

export default function AccesosMetricsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { loading, error, dashboard, asignaciones, asignacionesInactivas } = useDashboard(profile, {
    includeInactiveAssignments: true,
  });
  const metrics = useMemo(
    () =>
      buildAccessMetrics({
        dashboard,
        activeAssignments: asignaciones,
        inactiveAssignments: asignacionesInactivas,
      }),
    [asignaciones, asignacionesInactivas, dashboard],
  );
  const listSearch = location.state?.listSearch || "";

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-600">Calculando métricas de accesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(`/accesos${listSearch}`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a accesos
      </button>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={KeyRound}
          label="Accesos activos"
          value={metrics.activeAssignments}
          hint="Asignaciones vigentes"
        />
        <MetricCard
          icon={Users}
          label="Integrantes cubiertos"
          value={metrics.membersWithAccess}
          hint={`${metrics.coverageRate}% de integrantes activos`}
          tone="blue"
        />
        <MetricCard
          icon={Gauge}
          label="Ocupación"
          value={`${metrics.licenseOccupation}%`}
          hint="De las licencias registradas"
          tone="violet"
        />
        <MetricCard
          icon={Layers3}
          label="Licencias disponibles"
          value={metrics.licensesAvailable}
          hint="Capacidad todavía utilizable"
          tone="slate"
        />
        <MetricCard
          icon={ShieldAlert}
          label="Aplicaciones críticas"
          value={metrics.criticalApplications}
          hint={`${metrics.fullApplications} sin capacidad disponible`}
          tone="amber"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Accesos por retirar"
          value={metrics.pendingInactiveAssignments}
          hint={`${metrics.inactiveMembersWithAccess} integrantes inactivos`}
          tone={metrics.pendingInactiveAssignments ? "red" : "emerald"}
        />
      </section>

      {!metrics.activeMembers &&
      !metrics.registeredApplications &&
      !metrics.pendingInactiveAssignments ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <KeyRound className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">No hay accesos para analizar.</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Cobertura de accesos"
            description="Integrantes activos con y sin al menos una aplicación asignada."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.coverage}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  <Cell fill="#2D5A3D" />
                  <Cell fill="#F2A93B" />
                </Pie>
                <Tooltip formatter={(value) => [value, "Integrantes"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Accesos por área"
            description="Dónde se concentra actualmente el uso de aplicaciones institucionales."
          >
            {metrics.byArea.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.byArea} layout="vertical" margin={{ left: 16, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(value) => [value, "Accesos"]} />
                  <Bar dataKey="total" fill="#2D5A3D" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState>No hay accesos activos por área.</DashboardEmptyState>
            )}
          </ChartCard>

          <ChartCard
            title="Capacidad por aplicación"
            description="Licencias ocupadas y disponibles; las aplicaciones más exigidas aparecen primero."
            className="xl:col-span-2"
          >
            {metrics.licenseUsage.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.licenseUsage}
                  layout="vertical"
                  margin={{ left: 30, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupied" name="Ocupadas" stackId="capacity" fill="#2D5A3D" />
                  <Bar
                    dataKey="available"
                    name="Disponibles"
                    stackId="capacity"
                    fill="#CBD5E1"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState>No hay licencias registradas para analizar.</DashboardEmptyState>
            )}
          </ChartCard>

          <ChartCard
            title="Carga de acceso por integrante"
            description="Cuántos integrantes concentran una, dos o más aplicaciones asignadas."
          >
            {metrics.accessLoad.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.accessLoad}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [value, "Integrantes"]} />
                  <Bar dataKey="integrantes" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState>No hay carga de accesos para comparar.</DashboardEmptyState>
            )}
          </ChartCard>

          <ChartCard
            title="Accesos pendientes de retiro"
            description="Aplicaciones que todavía conservan integrantes inactivos."
          >
            {metrics.pendingByApplication.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.pendingByApplication}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [value, "Accesos pendientes"]} />
                  <Bar dataKey="total" fill="#D4574B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <DashboardEmptyState>No hay accesos pendientes de retiro.</DashboardEmptyState>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
