import {
  ArrowLeft,
  BarChart3,
  CalendarCheck2,
  Clock3,
  RefreshCw,
  UserRoundCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAgendaMetrics } from "@/hooks/useAgendaMetrics";

const COLORS = ["#059669", "#2563EB", "#7C3AED"];

function MetricCard({ icon: Icon, label, value, hint, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-600",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </article>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <div className="mt-5 h-72">{children}</div>
    </section>
  );
}

export default function AgendaMetricsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { metrics, loading, error } = useAgendaMetrics();
  const listSearch = location.state?.listSearch || "";
  const returnToAgenda = () => navigate(`/agenda/reuniones${listSearch}`);

  if (loading) {
    return (
      <div className="grid min-h-72 place-items-center rounded-2xl border border-slate-200 bg-white">
        <div className="text-center">
          <RefreshCw className="mx-auto h-7 w-7 animate-spin text-emerald-600" />
          <p className="mt-3 text-sm text-slate-600">Calculando métricas de reuniones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-page-enter space-y-5 pb-8">
      <button
        type="button"
        onClick={returnToAgenda}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a agenda
      </button>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          icon={CalendarCheck2}
          label="Reuniones"
          value={metrics.total_reuniones}
          hint="Confirmadas y finalizadas"
        />
        <MetricCard
          icon={UserRoundCheck}
          label="Organizadas"
          value={metrics.organizadas}
          hint="Creadas por ti"
          tone="blue"
        />
        <MetricCard
          icon={Users}
          label="Como participante"
          value={metrics.como_participante}
          hint="Organizadas por otra persona"
          tone="violet"
        />
        <MetricCard
          icon={Clock3}
          label="Horas en reuniones"
          value={metrics.horas_totales}
          hint="Tiempo confirmado acumulado"
          tone="amber"
        />
        <MetricCard
          icon={Clock3}
          label="Duración promedio"
          value={`${metrics.promedio_minutos} min`}
          hint="Por reunión finalizada"
          tone="slate"
        />
        <MetricCard
          icon={UsersRound}
          label="Colaboradores"
          value={metrics.colaboradores}
          hint="Personas distintas"
          tone="emerald"
        />
      </section>

      {!metrics.total_reuniones ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BarChart3 className="mx-auto h-9 w-9 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            Aún no tienes reuniones finalizadas para analizar.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Reuniones por mes"
            description="Evolución de reuniones confirmadas y finalizadas."
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.por_mes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="total" name="Reuniones" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Modalidad"
            description="Distribución entre reuniones virtuales, presenciales e híbridas."
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.por_modalidad}
                  dataKey="total"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {metrics.por_modalidad.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </section>
      )}
    </div>
  );
}
