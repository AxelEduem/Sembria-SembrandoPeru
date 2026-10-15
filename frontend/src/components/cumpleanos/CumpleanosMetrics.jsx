import { Building2, CakeSlice, CalendarDays, CalendarRange } from "lucide-react";
import CumpleanosMetric from "./CumpleanosMetric";

export default function CumpleanosMetrics({ stats, loading }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <CumpleanosMetric
        label="Cumpleaños este mes"
        value={stats.currentMonth}
        icon={CalendarDays}
        hint="Mes calendario actual"
        loading={loading}
      />
      <CumpleanosMetric
        label="Esta semana"
        value={stats.currentWeek}
        icon={CalendarRange}
        hint="Semana calendario actual"
        loading={loading}
      />
      <CumpleanosMetric
        label="Hoy"
        value={stats.today}
        icon={CakeSlice}
        hint="Cumpleaños que ocurren hoy"
        loading={loading}
      />
      <CumpleanosMetric
        label="Área con más cumpleaños"
        value={stats.topArea}
        icon={Building2}
        hint="Según los registros visibles"
        loading={loading}
      />
    </section>
  );
}