import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  ScrollText,
  Users,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getBitacoraMetricsCache } from "@/services/bitacora/cache";
import { getBitacoraMetrics } from "@/services/bitacora/bitacoraService";
import { getPermissionScopeKey, PERMISSIONS } from "@/utils/permissions";

const COLORS = ["#2D5A3D", "#2563EB", "#D97706", "#7C3AED", "#64748B", "#0F766E"];

function MetricCard({ icon: Icon, label, value, hint, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    red: "border-red-100 bg-red-50 text-red-700",
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

export default function BitacoraMetricsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const cacheScope = useMemo(() => {
    const account = profile?.cuenta_acceso_id || profile?.id || "anon";
    return `${account}:${getPermissionScopeKey(profile, PERMISSIONS.BITACORA_VER_METRICAS)}`;
  }, [profile]);
  const [metrics, setMetrics] = useState(() => getBitacoraMetricsCache(cacheScope)?.data || null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => getBitacoraMetricsCache(cacheScope) === null);

  const loadMetrics = useCallback(
    async ({ force = false } = {}) => {
      setLoading(true);
      setError("");

      try {
        const response = await getBitacoraMetrics({ force, cacheScope });
        setMetrics(response?.data || null);
      } catch (requestError) {
        setError(requestError?.message || "No se pudieron cargar las métricas.");
      } finally {
        setLoading(false);
      }
    },
    [cacheScope],
  );

  useEffect(() => {
    let mounted = true;

    getBitacoraMetrics({ cacheScope })
      .then((response) => {
        if (mounted) {
          setMetrics(response?.data || null);
          setError("");
        }
      })
      .catch((requestError) => {
        if (mounted) setError(requestError?.message || "No se pudieron cargar las métricas.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [cacheScope]);

  if (loading && !metrics)
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-700" />
          <p className="mt-3 text-sm font-medium text-slate-600">Calculando métricas...</p>
        </div>
      </div>
    );

  const summary = metrics?.summary || {};
  const resultData = [
    { name: "Exitosos", total: summary.exitosos || 0 },
    { name: "Errores", total: summary.errores || 0 },
  ];

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate(`/bitacora${location.state?.listSearch || ""}`)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a bitácora
      </button>
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loadMetrics({ force: true })}
          >
            Reintentar
          </Button>
        </div>
      )}
      {metrics && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={ScrollText}
              label="Eventos"
              value={summary.total || 0}
              hint="Operaciones registradas"
            />
            <MetricCard
              icon={CheckCircle2}
              label="Exitosos"
              value={summary.exitosos || 0}
              hint={`${summary.tasa_exito || 0}% de efectividad`}
              tone="blue"
            />
            <MetricCard
              icon={AlertTriangle}
              label="Errores"
              value={summary.errores || 0}
              hint="Operaciones no completadas"
              tone="red"
            />
            <MetricCard
              icon={Users}
              label="Usuarios"
              value={summary.usuarios || 0}
              hint="Responsables identificados"
              tone="violet"
            />
            <MetricCard
              icon={Activity}
              label="Tasa de éxito"
              value={`${summary.tasa_exito || 0}%`}
              hint="Salud operativa global"
            />
          </section>
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard
              title="Actividad de los últimos 30 días"
              description="Volumen diario y operaciones con error."
              className="xl:col-span-2"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.por_dia || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Eventos"
                    stroke="#2D5A3D"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="errores"
                    name="Errores"
                    stroke="#DC2626"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Módulos con mayor actividad"
              description="Operaciones y errores agrupados por módulo."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.por_modulo || []} layout="vertical" margin={{ left: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={105}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Eventos" fill="#2D5A3D" radius={[0, 6, 6, 0]} />
                  <Bar dataKey="errores" name="Errores" fill="#DC2626" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Resultado de operaciones"
              description="Proporción global entre operaciones exitosas y fallidas."
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resultData}
                    dataKey="total"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                  >
                    {resultData.map((entry, index) => (
                      <Cell key={entry.name} fill={["#2D5A3D", "#DC2626"][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Acciones más frecuentes"
              description="Tipos de operación realizados con mayor frecuencia."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.por_accion || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="nombre"
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Eventos" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard
              title="Usuarios con mayor actividad"
              description="Responsables con más operaciones registradas."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.usuarios_activos || []}
                  layout="vertical"
                  margin={{ left: 18 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={110}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="total" name="Eventos" fill={COLORS[3]} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
