import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ClipboardPenLine,
  Flag,
  UsersRound,
} from "lucide-react";

import TaskPersonAvatar from "@/components/tareas/TaskPersonAvatar";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EMPTY_FORM = {
  titulo: "",
  descripcion: "",
  asignadas_a: [],
  prioridad: "media",
  fecha_limite: "",
};

const PRIORITIES = [
  {
    value: "baja",
    label: "Baja",
    color: "bg-sky-500",
    active: "border-sky-200 bg-sky-50 text-sky-700 ring-sky-100",
  },
  {
    value: "media",
    label: "Media",
    color: "bg-amber-500",
    active: "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100",
  },
  {
    value: "alta",
    label: "Alta",
    color: "bg-orange-500",
    active: "border-orange-200 bg-orange-50 text-orange-700 ring-orange-100",
  },
  {
    value: "urgente",
    label: "Urgente",
    color: "bg-rose-500",
    active: "border-rose-200 bg-rose-50 text-rose-700 ring-rose-100",
  },
];

export default function TaskFormDialog({ open, onOpenChange, people, task, saving, onSubmit }) {
  const [form, setForm] = useState(() => task ? {
    titulo: task.titulo || "",
    descripcion: task.descripcion || "",
    asignadas_a: (task.responsables || [task.responsable]).filter(Boolean).map((person) => person.id),
    prioridad: task.prioridad || "media",
    fecha_limite: task.fecha_limite || "",
  } : EMPTY_FORM);
  const [error, setError] = useState("");

  const groupedPeople = useMemo(() => {
    const groups = new Map();
    people.forEach((person) => {
      const area = person.area || "Sin área";
      groups.set(area, [...(groups.get(area) || []), person]);
    });
    return [...groups.entries()].sort(([first], [second]) => first.localeCompare(second, "es"));
  }, [people]);

  const selectedPeople = useMemo(
    () => people.filter((person) => form.asignadas_a.includes(person.id)),
    [form.asignadas_a, people],
  );

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleAssignee(personId) {
    setError("");
    setForm((current) => ({
      ...current,
      asignadas_a: current.asignadas_a.includes(personId)
        ? current.asignadas_a.filter((id) => id !== personId)
        : [...current.asignadas_a, personId],
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.titulo.trim().length < 3) {
      setError("Escribe un título de al menos 3 caracteres.");
      return;
    }
    if (!form.asignadas_a.length) {
      setError("Selecciona al menos una persona responsable.");
      return;
    }

    const result = await onSubmit({ ...form, titulo: form.titulo.trim() });
    if (result) onOpenChange(false);
  }

  const fieldClass = "h-11 rounded-xl border-slate-200 bg-white shadow-sm transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-2xl"
        closeClassName="right-5 top-5 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm hover:bg-white hover:text-slate-800"
      >
        <DialogHeader className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-6 pr-16 text-left sm:px-7">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <ClipboardPenLine className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                {task ? "Editar tarea" : "Asignar nueva tarea"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 max-w-lg text-sm leading-6 text-slate-600">
                Define qué se debe realizar, quién será responsable y cuándo esperas que esté listo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ClipboardPenLine className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Información de la tarea</h3>
                  <p className="text-xs text-slate-500">Describe el objetivo de forma clara y concreta.</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block space-y-2 text-sm font-semibold text-slate-700">
                  <span className="flex items-center justify-between gap-3">
                    <span>Título <span className="text-rose-500">*</span></span>
                    <span className="text-xs font-medium text-slate-400">{form.titulo.length}/140</span>
                  </span>
                  <Input
                    value={form.titulo}
                    onChange={(event) => updateField("titulo", event.target.value)}
                    maxLength={140}
                    placeholder="Ej. Preparar el reporte mensual"
                    className={fieldClass}
                    disabled={saving}
                    autoFocus
                  />
                </label>

                <label className="block space-y-2 text-sm font-semibold text-slate-700">
                  <span className="flex items-center justify-between gap-3">
                    <span>Descripción <span className="font-normal text-slate-400">(opcional)</span></span>
                    <span className="text-xs font-medium text-slate-400">{form.descripcion.length}/5000</span>
                  </span>
                  <textarea
                    value={form.descripcion}
                    onChange={(event) => updateField("descripcion", event.target.value)}
                    maxLength={5000}
                    rows={4}
                    placeholder="Agrega contexto, entregables o indicaciones útiles."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-normal text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    disabled={saving}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <UsersRound className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Asignación y planificación</h3>
                  <p className="text-xs text-slate-500">Selecciona responsables, prioridad y plazo.</p>
                </div>
              </div>

              <div className="space-y-5">
                <fieldset className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-700">
                      Responsables <span className="text-rose-500">*</span>
                    </p>
                    <span className="text-xs font-semibold text-emerald-700">
                      {selectedPeople.length} seleccionados
                    </span>
                  </div>
                  <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    {groupedPeople.map(([area, members]) => (
                      <div key={area}>
                        <p className="mb-2 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                          {area}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {members.map((person) => {
                            const selected = form.asignadas_a.includes(person.id);
                            return (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => toggleAssignee(person.id)}
                                disabled={saving}
                                aria-pressed={selected}
                                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                                  selected
                                    ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                                    : "border-slate-200 bg-white hover:border-emerald-200"
                                }`}
                              >
                                <TaskPersonAvatar person={person} expandable={false} />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold text-slate-800">
                                    {person.nombre}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                                    {person.cargo || "Sin cargo"}
                                  </span>
                                </span>
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                    selected
                                      ? "bg-emerald-600 text-white"
                                      : "border border-slate-200 bg-white text-transparent"
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Flag className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Prioridad
                  </legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PRIORITIES.map((priority) => {
                      const isActive = form.prioridad === priority.value;
                      return (
                        <button
                          key={priority.value}
                          type="button"
                          onClick={() => updateField("prioridad", priority.value)}
                          aria-pressed={isActive}
                          disabled={saving}
                          className={`flex h-10 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? `${priority.active} ring-2`
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-100"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${priority.color}`} />
                          {priority.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="block space-y-2 text-sm font-semibold text-slate-700 sm:max-w-xs">
                  <span className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-500" aria-hidden="true" />
                    Fecha límite <span className="font-normal text-slate-400">(opcional)</span>
                  </span>
                  <Input
                    type="date"
                    value={form.fecha_limite}
                    onChange={(event) => updateField("fecha_limite", event.target.value)}
                    className={fieldClass}
                    disabled={saving}
                  />
                </label>
              </div>
            </section>

            {error ? (
              <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl border-slate-200 px-5"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <ActionButton
              action="save"
              type="submit"
              loading={saving}
              loadingText="Guardando..."
            >
              {task ? "Guardar cambios" : "Asignar tarea"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
