import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table } from "@/components/ui/table";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileCheck2,
  SlidersHorizontal,
  Send,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
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

import { Input } from "@/components/ui/input";
import useEquipoMetrics from "@/hooks/gestion-proyectos/useEquipoMetrics";
import { buildEquipoMetrics } from "@/services/gestion-proyectos/equiposMetrics";

const LIST_PATH = "/gestion-proyectos/detecta/equipos";
const COLORS = ["#2D5A3D", "#2563EB", "#D97706", "#7C3AED", "#0891B2", "#64748B", "#E11D48"];
const tooltipStyle = { border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 12 };
const PERIOD_OPTIONS = [1, 3, 6, 12];

function formatLimaDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function periodForMonths(months) {
  const end = new Date();
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  return { desde: formatLimaDate(start), hasta: formatLimaDate(end) };
}

function defaultPeriod() {
  return { ...periodForMonths(12), equipoId: "" };
}

function MetricCard({ icon: Icon, label, value, hint, tone = "emerald" }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    blue: "border-blue-100 bg-blue-50 text-blue-700",
    amber: "border-amber-100 bg-amber-50 text-amber-700",
    violet: "border-violet-100 bg-violet-50 text-violet-700",
    cyan: "border-cyan-100 bg-cyan-50 text-cyan-700",
    slate: "border-slate-200 bg-slate-100 text-slate-600",
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}>
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
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)] ${className}`}>
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      <div className="mt-5 h-80">{children}</div>
    </section>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
      <BarChart3 className="h-7 w-7" />
      <p className="mt-3 text-sm">{message}</p>
    </div>
  );
}

function LeaderInsight({ icon: Icon, label, team, detail }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm"><Icon className="h-4.5 w-4.5" /></span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{team?.nombre || "Sin datos"}</p>
        <p className="text-xs text-slate-500">{team ? detail(team) : "No hay registros en el periodo."}</p>
      </div>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-slate-100" />
            <div className="mt-4 h-7 w-16 rounded bg-slate-100" />
            <div className="mt-3 h-3 w-24 rounded bg-slate-100" />
          </div>
        ))}
      </section>
      <section className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-40 rounded bg-slate-100" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-14 rounded-xl bg-slate-100" />
          <div className="h-14 rounded-xl bg-slate-100" />
          <div className="h-14 rounded-xl bg-slate-100" />
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function EquipoMetricsPage() {
  const navigate = useNavigate();
  const { equipos, convocatorias, loading, error } = useEquipoMetrics();
  const [filters, setFilters] = useState(defaultPeriod);
  const [selectedPeriod, setSelectedPeriod] = useState(12);
  const [customMonths, setCustomMonths] = useState("");
  const metrics = useMemo(
    () => buildEquipoMetrics(equipos, convocatorias, filters),
    [convocatorias, equipos, filters],
  );
  const performanceRows = metrics.byTeam.filter((team) => team.registradas > 0).slice(0, 10);

  function applyPeriod(months, periodKey = months) {
    setFilters((current) => ({ ...current, ...periodForMonths(months) }));
    setSelectedPeriod(periodKey);
  }

  function updateCustomMonths(value) {
    setCustomMonths(value);
    const months = Number(value);
    if (Number.isInteger(months) && months >= 1 && months <= 120) {
      applyPeriod(months, "custom");
    } else {
      setSelectedPeriod(null);
    }
  }

  return (
    <div className="module-page-enter space-y-5 pb-10">
      <div>
        <button type="button" onClick={() => navigate(LIST_PATH)} className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} /> Volver a equipos
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-[#2D5A3D]" />
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700">
              <SlidersHorizontal className="h-4.5 w-4.5" strokeWidth={1.8} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Filtros del análisis</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Delimita el periodo y compara todos los equipos o uno específico.</p>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((months) => (
                <button
                  key={months}
                  type="button"
                  aria-pressed={selectedPeriod === months}
                  onClick={() => {
                    setCustomMonths("");
                    applyPeriod(months);
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    selectedPeriod === months
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  {months === 1 ? "Último mes" : `Últimos ${months} meses`}
                </button>
              ))}
            </div>

            <label className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 transition ${selectedPeriod === "custom" ? "border-emerald-400 ring-2 ring-emerald-500/10" : "border-slate-200"}`}>
              <span className="whitespace-nowrap text-xs font-semibold text-slate-500">Últimos</span>
              <input
                type="number"
                min="1"
                max="120"
                inputMode="numeric"
                value={customMonths}
                onChange={(event) => updateCustomMonths(event.target.value)}
                placeholder="N°"
                aria-label="Cantidad personalizada de últimos meses"
                className="h-7 w-14 rounded-md border border-slate-200 bg-slate-50 px-2 text-center text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-xs font-semibold text-slate-500">meses</span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors focus-within:border-emerald-300 focus-within:bg-emerald-50/40">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <CalendarDays className="h-3.5 w-3.5 text-emerald-700" /> Fecha inicial
              </span>
              <Input
                type="date"
                value={filters.desde}
                max={filters.hasta}
                onChange={(event) => {
                  setSelectedPeriod(null);
                  setCustomMonths("");
                  setFilters((current) => ({ ...current, desde: event.target.value }));
                }}
                className="mt-2 h-11 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm transition hover:border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </label>

            <label className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors focus-within:border-emerald-300 focus-within:bg-emerald-50/40">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <CalendarRange className="h-3.5 w-3.5 text-emerald-700" /> Fecha final
              </span>
              <Input
                type="date"
                value={filters.hasta}
                min={filters.desde}
                onChange={(event) => {
                  setSelectedPeriod(null);
                  setCustomMonths("");
                  setFilters((current) => ({ ...current, hasta: event.target.value }));
                }}
                className="mt-2 h-11 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm transition hover:border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              />
            </label>

            <label className="group rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition-colors focus-within:border-emerald-300 focus-within:bg-emerald-50/40">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                <UsersRound className="h-3.5 w-3.5 text-emerald-700" /> Equipo responsable
              </span>
              <select
                value={filters.equipoId}
                onChange={(event) => setFilters((current) => ({ ...current, equipoId: event.target.value }))}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Todos los equipos</option>
                {equipos.map((team) => <option key={team.id} value={team.id}>{team.nombre}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 text-xs leading-5 text-emerald-800">
            <Target className="mt-0.5 h-4 w-4 shrink-0" />
            <p>La efectividad compara convocatorias aprobadas frente al total registrado por cada equipo dentro del periodo.</p>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <MetricsSkeleton />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard icon={UsersRound} label="Equipos analizados" value={metrics.summary.equipos} hint="Dentro de tu alcance" />
            <MetricCard icon={FileCheck2} label="Registradas" value={metrics.summary.registradas} hint="Convocatorias detectadas" tone="blue" />
            <MetricCard icon={CheckCircle2} label="Aprobadas" value={metrics.summary.aprobadas} hint={`${metrics.summary.tasa_aprobacion}% de las decididas`} tone="emerald" />
            <MetricCard icon={Target} label="Efectividad" value={`${metrics.summary.efectividad}%`} hint="Aprobadas sobre registradas" tone="violet" />
            <MetricCard icon={Send} label="Postulaciones enviadas" value={metrics.summary.enviadas} hint={`${metrics.summary.cerradas} procesos cerrados`} tone="cyan" />
            <MetricCard icon={Clock3} label="Tiempo de decisión" value={metrics.summary.promedio_decision_dias === null ? "—" : `${metrics.summary.promedio_decision_dias} d`} hint="Promedio desde el registro" tone="amber" />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4"><h2 className="text-sm font-bold text-slate-900">Hallazgos destacados</h2><p className="mt-1 text-xs text-slate-500">Liderazgos del periodo según volumen y conversión.</p></div>
            <div className="grid gap-3 lg:grid-cols-3">
              <LeaderInsight icon={FileCheck2} label="Mayor registro" team={metrics.leaders.topByRegistrations} detail={(team) => `${team.registradas} convocatorias registradas`} />
              <LeaderInsight icon={Trophy} label="Más aprobaciones" team={metrics.leaders.topByApprovals} detail={(team) => `${team.aprobadas} aprobadas · ${team.efectividad}% de efectividad`} />
              <LeaderInsight icon={Award} label="Mejor efectividad" team={metrics.leaders.topByEffectiveness} detail={(team) => `${team.efectividad}% · ${team.aprobadas} de ${team.registradas}`} />
            </div>
          </section>

          {!metrics.summary.registradas ? (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"><BarChart3 className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">No hay convocatorias para analizar con estos filtros.</p></section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <ChartCard title="Producción y resultados por equipo" description="Compara registros, aprobaciones y postulaciones enviadas." className="xl:col-span-2">
                {performanceRows.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={performanceRows} margin={{ left: 8, right: 12 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="nombre" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend /><Bar dataKey="registradas" name="Registradas" fill="#94A3B8" radius={[5, 5, 0, 0]} /><Bar dataKey="aprobadas" name="Aprobadas" fill="#2D5A3D" radius={[5, 5, 0, 0]} /><Bar dataKey="enviadas" name="Enviadas" fill="#2563EB" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart message="No hay producción por equipo." />}
              </ChartCard>

              <ChartCard title="Efectividad por equipo" description="Porcentaje de aprobadas sobre todas las oportunidades registradas.">
                {performanceRows.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={performanceRows} layout="vertical" margin={{ left: 25, right: 20 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" /><XAxis type="number" domain={[0, 100]} unit="%" axisLine={false} tickLine={false} /><YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [`${value}%`, "Efectividad"]} contentStyle={tooltipStyle} /><Bar dataKey="efectividad" fill="#7C3AED" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart message="No hay efectividad calculable." />}
              </ChartCard>

              <ChartCard title="Estado de decisiones" description="Aprobadas, no aprobadas y pendientes de decisión.">
                {metrics.approvalDistribution.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={metrics.approvalDistribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={98} paddingAngle={3}>{metrics.approvalDistribution.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend /></PieChart></ResponsiveContainer> : <EmptyChart message="No hay decisiones registradas." />}
              </ChartCard>

              <ChartCard title="Evolución mensual" description="Registros y aprobaciones durante los últimos 12 meses con actividad." className="xl:col-span-2">
                {metrics.trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={metrics.trend} margin={{ left: 4, right: 18 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Legend /><Line type="monotone" dataKey="registradas" name="Registradas" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="aprobadas" name="Aprobadas" stroke="#2D5A3D" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer> : <EmptyChart message="No hay tendencia mensual disponible." />}
              </ChartCard>

              <ChartCard title="Etapa actual del portafolio" description="Dónde se encuentran hoy las convocatorias del periodo." className="xl:col-span-2">
                {metrics.stages.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={metrics.stages}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} /><Bar dataKey="value" name="Convocatorias" radius={[6, 6, 0, 0]}>{metrics.stages.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart message="No hay etapas para mostrar." />}
              </ChartCard>
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-bold text-slate-900">Detalle comparativo por equipo</h2><p className="mt-1 text-xs text-slate-500">Ranking completo con volumen, conversión y velocidad de decisión.</p></div>
            <div className="overflow-x-auto"><Table className="w-full min-w-[1100px] text-left text-sm"><thead className="bg-slate-50 text-[10px] tracking-wide text-slate-500 uppercase"><tr><th className="px-5 py-3">Equipo</th><th className="px-3 py-3 text-center">Integrantes</th><th className="px-3 py-3 text-center">Registradas</th><th className="px-3 py-3 text-center">Aprobadas</th><th className="px-3 py-3 text-center">Enviadas</th><th className="px-3 py-3 text-center">Cerradas</th><th className="px-3 py-3 text-center">Efectividad</th><th className="px-3 py-3 text-center">Tasa aprobación</th><th className="px-3 py-3 text-center">Conversión envío</th><th className="px-5 py-3 text-right">Días decisión</th></tr></thead><tbody className="divide-y divide-slate-100">{metrics.byTeam.map((team, index) => <tr key={team.id} className="hover:bg-slate-50/70"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">{index + 1}</span><div><p className="font-semibold text-slate-800">{team.nombre}</p><p className="text-xs text-slate-400">{team.area}</p></div></div></td><td className="px-3 py-3.5 text-center text-slate-600">{team.integrantes}</td><td className="px-3 py-3.5 text-center font-semibold text-slate-700">{team.registradas}</td><td className="px-3 py-3.5 text-center font-semibold text-emerald-700">{team.aprobadas}</td><td className="px-3 py-3.5 text-center text-blue-700">{team.enviadas}</td><td className="px-3 py-3.5 text-center text-slate-600">{team.cerradas}</td><td className="px-3 py-3.5 text-center"><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{team.efectividad}%</span></td><td className="px-3 py-3.5 text-center text-slate-600">{team.tasa_aprobacion}%</td><td className="px-3 py-3.5 text-center text-slate-600">{team.tasa_envio}%</td><td className="px-5 py-3.5 text-right text-slate-600">{team.promedio_decision_dias === null ? "—" : team.promedio_decision_dias}</td></tr>)}</tbody></Table></div>
          </section>
        </>
      )}
    </div>
  );
}
