import {
  CheckCircle2,
  Clock3,
  PlayCircle,
  UserX,
  Users,
} from "lucide-react";

const cards = [
  {
    key: "total",
    label: "Integrantes",
    description: "Personas visibles para la fecha",
    icon: Users,
    iconClass: "bg-slate-50 text-slate-600 border-slate-200",
  },
  {
    key: "En jornada",
    label: "En jornada",
    description: "Bloques activos",
    icon: PlayCircle,
    iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    key: "upcoming",
    label: "Por iniciar",
    description: "Bloques pendientes",
    icon: Clock3,
    iconClass: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    key: "Completada",
    label: "Completados",
    description: "Bloques finalizados",
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    key: "Falta",
    label: "Faltas",
    description: "Jornadas no iniciadas",
    icon: UserX,
    iconClass: "bg-rose-50 text-rose-600 border-rose-100",
  },
];

function getMetricValue(key, totals) {
  if (key === "total") return totals.total || 0;

  if (key === "upcoming") {
    return (
      (totals.Próximo || 0) +
      (totals["Inicio pendiente"] || 0) +
      (totals.Programado || 0)
    );
  }

  return totals[key] || 0;
}

function SeguimientoMetrics({ totals, loading = false }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map(
        (
          { key, label, description, icon: Icon, iconClass },
          index,
        ) => {
          const value = getMetricValue(key, totals);

          return (
            <article
              key={key}
              className={`seguimiento-card-enter rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]`}
              style={{
                animationDelay: `${index * 55}ms`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    ${iconClass}
                  `}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {loading ? (
                  <div className="seguimiento-skeleton h-8 w-10 rounded-lg" />
                ) : (
                  <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {value}
                  </span>
                )}
              </div>

              <p className="mt-4 text-xs font-bold text-slate-800">
                {label}
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-400">
                {description}
              </p>
            </article>
          );
        },
      )}
    </section>
  );
}

export default SeguimientoMetrics;
