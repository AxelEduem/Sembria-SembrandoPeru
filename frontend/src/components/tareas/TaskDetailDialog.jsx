import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  MessageSquareText,
  Pencil,
  Send,
  UserRound,
  XCircle,
} from "lucide-react";

import TaskPersonAvatar from "@/components/tareas/TaskPersonAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_META = {
  pendiente: { label: "Pendiente", className: "bg-amber-400/20 text-amber-50 ring-amber-300/30" },
  en_progreso: { label: "En progreso", className: "bg-sky-400/20 text-sky-50 ring-sky-300/30" },
  completada: { label: "Completada", className: "bg-white/20 text-white ring-white/25" },
  cancelada: { label: "Cancelada", className: "bg-slate-400/20 text-slate-100 ring-slate-300/30" },
};

const PRIORITY_LABELS = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

function formatDate(value, withTime = false) {
  if (!value) return "Sin plazo definido";
  const date = withTime ? new Date(value) : new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function isOverdue(task) {
  if (!task.fecha_limite || ["completada", "cancelada"].includes(task.estado)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${task.fecha_limite}T00:00:00`) < today;
}

export default function TaskDetailDialog({ task, open, onOpenChange, saving, onStatus, onAddNote, onEdit }) {
  const [note, setNote] = useState("");

  if (!task) return null;

  async function submitNote(event) {
    event.preventDefault();
    const content = note.trim();
    if (!content) return;
    const updated = await onAddNote(task.id, content);
    if (updated) setNote("");
  }

  const terminal = ["completada", "cancelada"].includes(task.estado);
  const canEdit = task.soy_creador && task.estado === "pendiente";
  const canCancel = task.soy_creador && !terminal;
  const hasActions = !terminal;
  const overdue = isOverdue(task);
  const status = STATUS_META[task.estado] || STATUS_META.pendiente;
  const responsibles = (task.responsables || [task.responsable]).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl border-0 bg-slate-50 p-0 shadow-[0_28px_80px_rgba(15,23,42,0.28)] sm:max-w-3xl"
        overlayClassName="bg-slate-950/55 backdrop-blur-[2px]"
        closeClassName="right-5 top-5 rounded-full bg-white/15 p-2 text-white opacity-100 hover:bg-white/25 hover:text-white"
      >
        <DialogHeader className="relative overflow-hidden bg-gradient-to-br from-[#173c2b] via-[#24613f] to-[#3c7a4f] px-6 py-7 pr-16 text-left sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20 sm:flex">
              <ClipboardCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ring-1 ${status.className}`}>
                  {status.label}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-50 ring-1 ring-white/15">
                  Prioridad {PRIORITY_LABELS[task.prioridad] || task.prioridad}
                </span>
              </div>
              <DialogTitle className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {task.titulo}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-emerald-50/80">
                Creada por <span className="font-semibold text-white">{task.creador?.nombre || "Sin información"}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 space-y-5 overflow-y-auto px-5 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]" aria-labelledby="task-responsibles-title">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Asignación</p>
                  <h3 id="task-responsibles-title" className="text-sm font-extrabold text-slate-800">
                    {responsibles.length === 1 ? "Responsable" : `${responsibles.length} responsables`}
                  </h3>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {responsibles.map((person) => (
                  <div key={person.id} className="flex min-w-0 items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-100">
                    <TaskPersonAvatar person={person} className="h-9 w-9 rounded-xl" />
                    <p className="truncate text-sm font-semibold text-slate-700">{person.nombre}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-2xl border bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)] ${overdue ? "border-red-200" : "border-slate-200"}`} aria-labelledby="task-due-date-title">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${overdue ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-700"}`}>
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Planificación</p>
                  <h3 id="task-due-date-title" className="text-sm font-extrabold text-slate-800">Fecha límite</h3>
                </div>
              </div>
              <p className={`mt-5 text-base font-bold capitalize ${overdue ? "text-red-700" : "text-slate-700"}`}>
                {formatDate(task.fecha_limite)}
              </p>
              <p className={`mt-1 text-xs ${overdue ? "font-semibold text-red-500" : "text-slate-400"}`}>
                {overdue ? "Esta tarea se encuentra vencida" : "Plazo establecido para completar la tarea"}
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <h3 className="text-sm font-extrabold text-slate-800">Indicaciones de la tarea</h3>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {task.descripcion || "Esta tarea no tiene una descripción adicional."}
            </p>
          </section>

          {hasActions ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]" aria-label="Acciones de la tarea">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Acciones disponibles</p>
              <div className="flex flex-wrap gap-2">
                {canEdit ? (
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => onEdit(task)} disabled={saving}>
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                ) : null}
                {!terminal && task.estado !== "en_progreso" ? (
                  <Button type="button" variant="outline" className="rounded-xl border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800" onClick={() => onStatus(task.id, "en_progreso")} disabled={saving}>
                    <Clock3 className="h-4 w-4" /> Iniciar
                  </Button>
                ) : null}
                {!terminal ? (
                  <Button type="button" className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => onStatus(task.id, "completada")} disabled={saving}>
                    <CheckCircle2 className="h-4 w-4" /> Completar
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button type="button" variant="ghost" className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onStatus(task.id, "cancelada")} disabled={saving}>
                    <XCircle className="h-4 w-4" /> Cancelar
                  </Button>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Notas y seguimiento</h3>
                <p className="text-xs text-slate-400">{task.notas?.length || 0} registros en el historial</p>
              </div>
            </div>

            <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
              {task.notas?.length ? task.notas.map((item) => (
                <div key={item.id} className={`rounded-2xl border p-3 ${item.es_mia ? "border-emerald-100 bg-emerald-50/70" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-slate-700">{item.autor?.nombre}</p>
                    <time className="text-[11px] text-slate-400">{formatDate(item.created_at, true)}</time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-slate-600">{item.contenido}</p>
                </div>
              )) : (
                <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                  Aún no hay notas. Agrega recordatorios, avances o acuerdos.
                </p>
              )}
            </div>

            <form onSubmit={submitNote} className="mt-4 flex items-end gap-2">
              <label className="sr-only" htmlFor="task-note">Nueva nota</label>
              <textarea
                id="task-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={2000}
                rows={2}
                placeholder="Escribe una nota o avance..."
                className="min-h-11 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                disabled={saving}
              />
              <Button type="submit" size="icon-lg" className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={saving || !note.trim()} aria-label="Agregar nota">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
