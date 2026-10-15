import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
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

import CumpleanosMetrics from "@/components/cumpleanos/CumpleanosMetrics";
import { useCumpleanos } from "@/hooks/useCumpleanos";
import { buildCumpleanosMetrics } from "@/services/cumpleanos/metrics";

const COLORS = ["#E11D48", "#F59E0B", "#2563EB", "#7C3AED", "#0D9488", "#64748B"];

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

export default function CumpleanosMetricsPage() {
  const navigate = useNavigate();
  const { rows, loading, error } = useCumpleanos();
  const metrics = useMemo(() => buildCumpleanosMetrics(rows), [rows]);

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-6 w-6 animate-spin text-rose-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">Calculando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={() => navigate("/cumpleanos")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a cumpleaños
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <CumpleanosMetrics stats={metrics} loading={false} />

      {!metrics.total ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No hay cumpleaños para analizar.</p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ChartCard
            title="Cumpleaños por mes"
            description="Distribución anual de los cumpleaños registrados."
            className="xl:col-span-2"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.byMonth} margin={{ left: 0, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Cumpleaños" fill="#E11D48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cumpleaños por área"
            description={`El área principal es ${metrics.topArea}, con ${metrics.topAreaTotal} cumpleaños.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.byArea.slice(0, 8)}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
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
                <Bar dataKey="total" name="Cumpleaños" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cumpleaños por tipo de integrante"
            description="Proporción entre los tipos de integrantes activos."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.byType}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={3}
                >
                  {metrics.byType.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
