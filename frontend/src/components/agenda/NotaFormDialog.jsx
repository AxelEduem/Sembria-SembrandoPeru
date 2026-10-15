import { Pin, StickyNote } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const EMPTY_FORM = { titulo: "", contenido: "", color: "amarillo", fijada: false };
const COLORS = {
  amarillo: { label: "Amarillo", dot: "bg-amber-400", selected: "border-amber-300 bg-amber-50 text-amber-800 ring-amber-100" },
  verde: { label: "Verde", dot: "bg-emerald-500", selected: "border-emerald-300 bg-emerald-50 text-emerald-800 ring-emerald-100" },
  azul: { label: "Azul", dot: "bg-sky-500", selected: "border-sky-300 bg-sky-50 text-sky-800 ring-sky-100" },
  violeta: { label: "Violeta", dot: "bg-violet-500", selected: "border-violet-300 bg-violet-50 text-violet-800 ring-violet-100" },
  rosa: { label: "Rosa", dot: "bg-rose-400", selected: "border-rose-300 bg-rose-50 text-rose-800 ring-rose-100" },
};

export default function NotaFormDialog({ open, onOpenChange, note, saving, onSubmit }) {
  const [form, setForm] = useState(() => note ? {
    titulo: note.titulo || "",
    contenido: note.contenido || "",
    color: note.color || "amarillo",
    fijada: Boolean(note.fijada),
  } : EMPTY_FORM);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleOpenChange(nextOpen) {
    if (!saving) onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const title = form.titulo.trim();
    if (title.length < 2) {
      setError("Escribe un título de al menos 2 caracteres.");
      return;
    }

    const saved = await onSubmit({
      ...form,
      titulo: title,
      contenido: form.contenido.trim(),
    });
    if (saved) onOpenChange(false);
  }

  const fieldClass = "h-11 rounded-xl border-slate-200 bg-white shadow-sm transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-2xl border-0 bg-slate-50 p-0 shadow-2xl sm:max-w-2xl"
        closeClassName="right-5 top-5 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm hover:bg-white hover:text-slate-800"
      >
        <DialogHeader className="relative overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-6 pr-16 text-left sm:px-7">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <StickyNote className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
                {note ? "Editar nota" : "Nueva nota"}
              </DialogTitle>
              <DialogDescription className="mt-1.5 max-w-lg text-sm leading-6 text-slate-600">
                Guarda una idea o recordatorio privado que solo estará disponible en tu cuenta.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="flex min-h-0 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <StickyNote className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Información de la nota</h3>
                  <p className="text-xs text-slate-500">Escribe un título claro y el contenido que quieras recordar.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="nota-titulo" className="mb-1.5 block text-xs font-bold text-slate-700">Título</label>
                  <Input
                    id="nota-titulo"
                    value={form.titulo}
                    onChange={(event) => updateField("titulo", event.target.value)}
                    minLength={2}
                    maxLength={140}
                    required
                    placeholder="Ej. Ideas para la presentación"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="nota-contenido" className="mb-1.5 block text-xs font-bold text-slate-700">Contenido</label>
                  <textarea
                    id="nota-contenido"
                    value={form.contenido}
                    onChange={(event) => updateField("contenido", event.target.value)}
                    maxLength={10000}
                    rows={6}
                    placeholder="Escribe aquí tu nota..."
                    className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Pin className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Presentación</h3>
                  <p className="text-xs text-slate-500">Elige un color y decide si debe aparecer primero.</p>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-700">Color de la nota</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(COLORS).map(([color, meta]) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => updateField("color", color)}
                    aria-pressed={form.color === color}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ring-2 ring-transparent transition ${
                      form.color === color
                        ? meta.selected
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </button>
                ))}
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.fijada}
                  onChange={(event) => updateField("fijada", event.target.checked)}
                  className="h-4 w-4 accent-emerald-600"
                />
                <Pin className="h-4 w-4 text-slate-500" />
                Fijar esta nota en la parte superior
              </label>
            </section>

            {error ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                {error}
              </p>
            ) : null}
          </div>

          <DialogFooter className="border-t border-slate-200 bg-white px-5 py-4 sm:px-7">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving} className="rounded-xl">
              Cancelar
            </Button>
            <ActionButton action="save" type="submit" loading={saving} loadingText="Guardando...">
              {note ? "Guardar cambios" : "Guardar nota"}
            </ActionButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
