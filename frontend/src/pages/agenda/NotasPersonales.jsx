import {
  AlertCircle,
  ArrowLeft,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import NotaDeleteDialog from "@/components/agenda/NotaDeleteDialog";
import NotaFormDialog from "@/components/agenda/NotaFormDialog";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import { Input } from "@/components/ui/input";
import ManualButton from "@/components/ui/ManualButton";
import { useNotasPersonales } from "@/hooks/useNotasPersonales";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";

const COLOR_OPTIONS = {
  amarillo: {
    label: "Amarillo",
    dot: "bg-amber-400",
    bar: "from-amber-400 to-orange-400",
    icon: "bg-amber-100 text-amber-700",
  },
  verde: {
    label: "Verde",
    dot: "bg-emerald-500",
    bar: "from-emerald-500 to-teal-400",
    icon: "bg-emerald-100 text-emerald-700",
  },
  azul: {
    label: "Azul",
    dot: "bg-sky-500",
    bar: "from-sky-500 to-cyan-400",
    icon: "bg-sky-100 text-sky-700",
  },
  violeta: {
    label: "Violeta",
    dot: "bg-violet-500",
    bar: "from-violet-500 to-purple-400",
    icon: "bg-violet-100 text-violet-700",
  },
  rosa: {
    label: "Rosa",
    dot: "bg-rose-400",
    bar: "from-rose-400 to-pink-400",
    icon: "bg-rose-100 text-rose-700",
  },
};

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getExcelRows(rows) {
  return {
    headers: ["ID", "Título", "Contenido", "Color", "Fijada", "Fecha de creación", "Última actualización"],
    data: rows.map((note) => [
      note.id,
      note.titulo,
      note.contenido || "",
      COLOR_OPTIONS[note.color]?.label || note.color,
      note.fijada ? "Sí" : "No",
      formatExcelDate(note.created_at),
      formatExcelDate(note.updated_at),
    ]),
  };
}

export default function NotasPersonales() {
  const navigate = useNavigate();
  const notesApi = useNotasPersonales();
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState("todos");
  const [pinnedFilter, setPinnedFilter] = useState("todas");
  const [exporting, setExporting] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);

  const visibleNotes = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-PE");
    return notesApi.notes.filter((note) => {
      const matchesSearch = !term
        || `${note.titulo} ${note.contenido || ""}`.toLocaleLowerCase("es-PE").includes(term);
      const matchesColor = colorFilter === "todos" || note.color === colorFilter;
      const matchesPinned = pinnedFilter === "todas"
        || (pinnedFilter === "fijadas" ? note.fijada : !note.fijada);

      return matchesSearch && matchesColor && matchesPinned;
    });
  }, [colorFilter, notesApi.notes, pinnedFilter, search]);

  const hasFilters = Boolean(search.trim())
    || colorFilter !== "todos"
    || pinnedFilter !== "todas";

  function openCreate() {
    setEditingNote(null);
    setFormOpen(true);
  }

  async function downloadCurrent() {
    if (exporting || notesApi.loading || !visibleNotes.length) return;
    setExporting(true);
    try {
      await downloadExcel(getExcelRows(visibleNotes), "notas_personales.xlsx");
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setColorFilter("todos");
    setPinnedFilter("todas");
  }

  function openEdit(note) {
    setEditingNote(note);
    setFormOpen(true);
  }

  function changeFormOpen(nextOpen) {
    setFormOpen(nextOpen);
    if (!nextOpen) setEditingNote(null);
  }

  async function togglePinned(note) {
    await notesApi.save(
      {
        titulo: note.titulo,
        contenido: note.contenido || "",
        color: note.color,
        fijada: !note.fijada,
      },
      note.id,
    );
  }

  async function confirmDelete() {
    if (!deletingNote) return;
    const removed = await notesApi.remove(deletingNote.id);
    if (removed) setDeletingNote(null);
  }

  return (
    <div className="module-page-enter pb-6">
      <FeedbackToast feedback={notesApi.feedback} onClose={notesApi.clearFeedback} />

      <button
        type="button"
        onClick={() => navigate("/agenda")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a agenda
      </button>

      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap justify-end gap-2">
        <ManualButton to="/agenda/notas/manual" />
        <Button
          type="button"
          variant="outline"
          onClick={downloadCurrent}
          disabled={exporting || notesApi.loading || !visibleNotes.length}
          className="h-10 gap-2 rounded-xl"
        >
          <ExcelIcon className="h-4 w-4" />
          {exporting ? "Exportando..." : "Descargar Excel"}
        </Button>
        <Button
          type="button"
          onClick={openCreate}
          className="h-10 gap-2 rounded-xl bg-[#2D5A3D] text-white hover:bg-[#234B32]"
        >
          <Plus className="h-4 w-4" /> Nueva nota
        </Button>
      </section>

      <section className="module-section-enter module-enter-delay-2 mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título o contenido..."
                className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />
            </div>

            <div className="relative w-full">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
              <label className="sr-only" htmlFor="note-color-filter">Color</label>
              <select
                id="note-color-filter"
                value={colorFilter}
                onChange={(event) => setColorFilter(event.target.value)}
                className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-9 text-sm text-slate-700 outline-none transition-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="todos">Todos los colores</option>
                {Object.entries(COLOR_OPTIONS).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              <Pin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
              <label className="sr-only" htmlFor="note-pinned-filter">Estado de fijación</label>
              <select
                id="note-pinned-filter"
                value={pinnedFilter}
                onChange={(event) => setPinnedFilter(event.target.value)}
                className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-9 text-sm text-slate-700 outline-none transition-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              >
                <option value="todas">Todas las notas</option>
                <option value="fijadas">Notas fijadas</option>
                <option value="sin_fijar">Notas sin fijar</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {visibleNotes.length} de {notesApi.notes.length} {notesApi.notes.length === 1 ? "nota" : "notas"}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={clearFilters}
              disabled={!hasFilters}
              className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none sm:w-auto ${
                hasFilters
                  ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
              }`}
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
              Limpiar filtros
            </Button>
          </div>
        </div>
      </section>

      {notesApi.loading ? (
        <section className="module-section-enter module-enter-delay-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Cargando notas">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />)}
        </section>
      ) : notesApi.error ? (
        <section className="module-section-enter module-enter-delay-3 rounded-3xl border border-red-200 bg-red-50 px-6 py-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-800">{notesApi.error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={notesApi.refresh}><RefreshCw className="h-4 w-4" /> Reintentar</Button>
        </section>
      ) : visibleNotes.length ? (
        <section className="module-section-enter module-enter-delay-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleNotes.map((note) => {
            const theme = COLOR_OPTIONS[note.color] || COLOR_OPTIONS.amarillo;
            return (
              <article key={note.id} className="group relative flex min-h-72 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 pt-6 shadow-[0_5px_20px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar}`} />
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${theme.icon}`}><StickyNote className="h-4 w-4" /></span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => togglePinned(note)} disabled={notesApi.saving} aria-label={note.fijada ? "Desfijar nota" : "Fijar nota"} className={`rounded-lg p-2 transition hover:bg-white/80 ${note.fijada ? "text-amber-600" : "text-slate-400"}`}><Pin className={`h-4 w-4 ${note.fijada ? "fill-current" : ""}`} /></button>
                    <button type="button" onClick={() => openEdit(note)} aria-label={`Editar ${note.titulo}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/80 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDeletingNote(note)} disabled={notesApi.saving} aria-label={`Eliminar ${note.titulo}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <h2 className="mt-5 break-words text-lg font-extrabold leading-6 text-slate-900 transition group-hover:text-emerald-800">{note.titulo}</h2>
                <p className="mt-2 line-clamp-3 min-h-18 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">{note.contenido || "Sin contenido adicional."}</p>
                <div className="mt-auto border-t border-slate-100 pt-4 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Actualizada {formatDate(note.updated_at)}</div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="module-section-enter module-enter-delay-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><StickyNote className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-800">{hasFilters ? "No encontramos notas" : "Todavía no tienes notas"}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{hasFilters ? "Prueba cambiando o limpiando los filtros." : "Crea tu primera nota para guardar un recordatorio o una idea personal."}</p>
        </section>
      )}

      {formOpen ? (
        <NotaFormDialog
          key={editingNote?.id || "new"}
          open
          note={editingNote}
          saving={notesApi.saving}
          onOpenChange={changeFormOpen}
          onSubmit={(values) => notesApi.save(values, editingNote?.id || null)}
        />
      ) : null}

      <NotaDeleteDialog
        open={Boolean(deletingNote)}
        note={deletingNote}
        loading={notesApi.saving}
        onOpenChange={(nextOpen) => { if (!nextOpen) setDeletingNote(null); }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
