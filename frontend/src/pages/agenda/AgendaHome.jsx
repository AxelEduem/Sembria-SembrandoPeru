import { ArrowRight, CalendarRange, CheckSquare2, StickyNote } from "lucide-react";
import { Link } from "react-router-dom";

const OPTIONS = [
  {
    to: "/agenda/tareas",
    title: "Tareas",
    description: "Asigna responsabilidades, consulta avances y acompaña el trabajo de tu equipo.",
    icon: CheckSquare2,
    accent: "from-emerald-500 to-teal-600",
    surface: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  {
    to: "/agenda/notas",
    title: "Notas personales",
    description: "Guarda ideas, recordatorios y apuntes privados visibles únicamente para ti.",
    icon: StickyNote,
    accent: "from-amber-400 to-orange-500",
    surface: "bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    to: "/agenda/reuniones",
    title: "Reuniones",
    description: "Organiza encuentros, revisa invitaciones y encuentra horarios disponibles.",
    icon: CalendarRange,
    accent: "from-sky-500 to-indigo-600",
    surface: "bg-sky-50 text-sky-700 ring-sky-100",
  },
];

export default function AgendaHome() {
  return (
    <div className="module-page-enter pb-8">
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Organización personal</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">¿Qué quieres organizar hoy?</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Elige una herramienta para administrar tus pendientes, apuntes privados o reuniones.
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {OPTIONS.map((option, index) => {
          const Icon = option.icon;
          return (
            <Link
              key={option.to}
              to={option.to}
              className="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_5px_22px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${option.accent}`} />
              <span className="absolute right-5 top-4 text-6xl font-black text-slate-50">0{index + 1}</span>
              <span className={`relative flex h-13 w-13 items-center justify-center rounded-2xl ring-1 ${option.surface}`}>
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="relative mt-7 text-xl font-bold text-slate-900">{option.title}</h2>
              <p className="relative mt-3 flex-1 text-sm leading-6 text-slate-500">{option.description}</p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-700 transition group-hover:gap-3 group-hover:text-emerald-700">
                Ingresar <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
