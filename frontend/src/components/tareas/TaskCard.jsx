import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  MessageSquareText,
} from "lucide-react";

import TaskPersonAvatar from "@/components/tareas/TaskPersonAvatar";
import { Button } from "@/components/ui/button";

const PRIORITY_META = {
  baja: { label: "Baja", pill: "border-sky-200 bg-sky-50 text-sky-700", bar: "from-sky-400 to-cyan-400" },
  media: { label: "Media", pill: "border-slate-200 bg-slate-100 text-slate-700", bar: "from-slate-400 to-slate-300" },
  alta: { label: "Alta", pill: "border-amber-200 bg-amber-50 text-amber-700", bar: "from-amber-400 to-orange-400" },
  urgente: { label: "Urgente", pill: "border-red-200 bg-red-50 text-red-700", bar: "from-red-500 to-rose-500" },
};

const STATUS_META = {
  pendiente: { label: "Pendiente", icon: CircleDot, className: "bg-amber-50 text-amber-700 ring-amber-100" },
  en_progreso: { label: "En progreso", icon: Clock3, className: "bg-blue-50 text-blue-700 ring-blue-100" },
  completada: { label: "Completada", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  cancelada: { label: "Cancelada", icon: CircleDot, className: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function formatDate(value) {
  if (!value) return "Sin fecha límite";
  return new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function isOverdue(task) {
  if (!task.fecha_limite || ["completada", "cancelada"].includes(task.estado)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.fecha_limite}T00:00:00`) < today;
}

export default function TaskCard({ task, onOpen, onComplete, saving }) {
  const status = STATUS_META[task.estado] || STATUS_META.pendiente;
  const priority = PRIORITY_META[task.prioridad] || PRIORITY_META.media;
  const StatusIcon = status.icon;
  const overdue = isOverdue(task);
  const responsibles = (task.responsables || [task.responsable]).filter(Boolean);
  const visibleNames = responsibles.slice(0, 2).map((person) => person.nombre).join(", ");
  const remaining = Math.max(0, responsibles.length - 2);

  return (
    <article className="group relative flex h-full min-h-72 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 pt-6 shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        onClick={() => onOpen(task)}
        aria-label={`Abrir detalle de ${task.titulo}`}
      />
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${priority.bar}`} />

      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] ${priority.pill}`}>
          Prioridad {priority.label}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${status.className}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {status.label}
        </span>
      </div>

      <div className="mt-5 text-left">
        <h2 className={`text-lg font-extrabold leading-6 text-slate-900 transition group-hover:text-emerald-800 ${task.estado === "completada" ? "line-through decoration-slate-300" : ""}`}>
          {task.titulo}
        </h2>
        <p className="mt-2 line-clamp-3 min-h-15 text-sm leading-5 text-slate-500">
          {task.descripcion || "Sin descripción adicional."}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex -space-x-2">
          {responsibles.slice(0, 3).map((person) => (
            <TaskPersonAvatar key={person.id} person={person} className="h-9 w-9 rounded-xl ring-2 ring-white" />
          ))}
          {responsibles.length > 3 ? (
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-[10px] font-extrabold text-slate-600 ring-2 ring-white">
              +{responsibles.length - 3}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {responsibles.length === 1 ? "Responsable" : "Responsables"}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-slate-700">
            {visibleNames || "Sin información"}{remaining ? ` y ${remaining} más` : ""}
          </p>
          {task.soy_responsable ? (
            <p className="mt-0.5 truncate text-[10px] text-slate-500">
              Asignada por {task.creador?.nombre || "Sin información"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-semibold ${overdue ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>
          <CalendarDays className="h-3.5 w-3.5" /> {overdue ? "Venció " : ""}{formatDate(task.fecha_limite)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 font-semibold text-slate-500" title="Notas de seguimiento">
          <MessageSquareText className="h-3.5 w-3.5" /> {task.notas?.length || 0}
        </span>
      </div>

      {task.soy_responsable && !["completada", "cancelada"].includes(task.estado) ? (
        <div className="relative z-20 mt-auto flex justify-end pt-5">
          <Button type="button" className="rounded-xl bg-emerald-600 px-3.5 text-white hover:bg-emerald-700" onClick={() => onComplete(task)} disabled={saving} aria-label={`Completar ${task.titulo}`} title="Marcar como completada">
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </article>
  );
}
