import { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, ClipboardCheck, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TaskCard from "@/components/tareas/TaskCard";
import TaskDetailDialog from "@/components/tareas/TaskDetailDialog";
import TaskFormDialog from "@/components/tareas/TaskFormDialog";
import TareasFilters from "@/components/tareas/TareasFilters";
import { Button } from "@/components/ui/button";
import ExcelIcon from "@/components/ui/ExcelIcon";
import FeedbackToast from "@/components/ui/FeedbackToast";
import ManualButton from "@/components/ui/ManualButton";
import { useTareas } from "@/hooks/useTareas";
import { downloadExcel, formatExcelDate } from "@/utils/excelExport";

const STATUS_LABELS = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

function getExcelRows(rows) {
  return {
    headers: [
      "ID",
      "Tarea",
      "Descripción",
      "Responsable",
      "Asignada por",
      "Prioridad",
      "Estado",
      "Fecha límite",
      "Fecha de finalización",
      "Notas",
      "Fecha de creación",
    ],
    data: rows.map((task) => [
      task.id,
      task.titulo,
      task.descripcion || "",
      (task.responsables || [task.responsable]).filter(Boolean).map((person) => person.nombre).join(", "),
      task.creador?.nombre || "",
      task.prioridad,
      STATUS_LABELS[task.estado] || task.estado,
      formatExcelDate(task.fecha_limite),
      formatExcelDate(task.completada_at),
      task.notas?.length || 0,
      formatExcelDate(task.created_at),
    ]),
  };
}

export default function Tareas() {
  const navigate = useNavigate();
  const tareas = useTareas();
  const [view, setView] = useState("all");
  const [status, setStatus] = useState("pendiente");
  const [priority, setPriority] = useState("todas");
  const [dueDate, setDueDate] = useState("");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const visibleTasks = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-PE");

    return tareas.tasks.filter((task) => {
      const matchesView = view === "all"
        || (view === "mine" && task.soy_responsable)
        || (view === "assigned" && task.soy_creador);
      const matchesStatus = status === "todas"
        || task.estado === status;
      const matchesPriority = priority === "todas" || task.prioridad === priority;
      const matchesDueDate = !dueDate || task.fecha_limite === dueDate;
      const responsibleNames = (task.responsables || [task.responsable])
        .filter(Boolean)
        .map((person) => person.nombre)
        .join(" ");
      const haystack = `${task.titulo} ${task.descripcion || ""} ${task.creador?.nombre || ""} ${responsibleNames}`.toLocaleLowerCase("es-PE");

      return matchesView
        && matchesStatus
        && matchesPriority
        && matchesDueDate
        && (!term || haystack.includes(term));
    });
  }, [dueDate, priority, search, status, tareas.tasks, view]);

  async function downloadCurrent() {
    if (exporting || tareas.loading || !visibleTasks.length) return;
    setExporting(true);
    try {
      await downloadExcel(getExcelRows(visibleTasks), "tareas.xlsx");
    } finally {
      setExporting(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setView("all");
    setStatus("pendiente");
    setPriority("todas");
    setDueDate("");
  }

  async function changeStatus(taskId, nextStatus) {
    const updated = await tareas.changeStatus(taskId, nextStatus);
    if (updated && selectedTask?.id === taskId) setSelectedTask(updated);
    return updated;
  }

  async function addNote(taskId, content) {
    const updated = await tareas.addNote(taskId, content);
    if (updated) setSelectedTask(updated);
    return updated;
  }

  function openCreate() {
    setEditingTask(null);
    setFormOpen(true);
  }

  function openEdit(task) {
    setSelectedTask(null);
    setEditingTask(task);
    setFormOpen(true);
  }

  async function submitForm(values) {
    const updated = editingTask
      ? await tareas.updateTask(editingTask.id, values)
      : await tareas.createTask(values);
    if (updated) setEditingTask(null);
    return updated;
  }

  return (
    <div className="module-page-enter pb-6">
      <FeedbackToast feedback={tareas.feedback} onClose={tareas.clearFeedback} />

      <button
        type="button"
        onClick={() => navigate("/agenda")}
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
        Volver a agenda
      </button>

      <section className="module-section-enter module-enter-delay-1 mb-4 flex flex-wrap justify-end gap-2">
        <ManualButton to="/agenda/tareas/manual" />
        <Button
          type="button"
          variant="outline"
          onClick={downloadCurrent}
          disabled={exporting || tareas.loading || !visibleTasks.length}
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
          <Plus className="h-4 w-4" /> Nueva tarea
        </Button>
      </section>

      <div className="module-section-enter module-enter-delay-2">
        <TareasFilters
          search={search}
          view={view}
          status={status}
          priority={priority}
          dueDate={dueDate}
          onSearchChange={setSearch}
          onViewChange={setView}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onDueDateChange={setDueDate}
          onClear={clearFilters}
        />
      </div>

      {tareas.loading ? (
        <section className="module-section-enter module-enter-delay-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Cargando tareas">
          {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />)}
        </section>
      ) : tareas.error ? (
        <section className="module-section-enter module-enter-delay-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-800">{tareas.error}</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => tareas.refresh()}><RefreshCw className="h-4 w-4" /> Reintentar</Button>
        </section>
      ) : visibleTasks.length ? (
        <section className="module-section-enter module-enter-delay-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleTasks.map((task) => (
            <TaskCard key={task.id} task={task} saving={tareas.saving} onOpen={setSelectedTask} onComplete={(item) => changeStatus(item.id, "completada")} />
          ))}
        </section>
      ) : (
        <section className="module-section-enter module-enter-delay-3 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><ClipboardCheck className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-bold text-slate-800">No hay tareas en esta vista</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Ajusta los filtros para consultar las tareas recibidas o asignadas por ti.</p>
        </section>
      )}

      {formOpen ? (
        <TaskFormDialog
          key={editingTask?.id || "new"}
          open
          onOpenChange={setFormOpen}
          people={tareas.people}
          task={editingTask}
          saving={tareas.saving}
          onSubmit={submitForm}
        />
      ) : null}
      {selectedTask ? (
        <TaskDetailDialog
          key={selectedTask.id}
          task={selectedTask}
          open
          onOpenChange={(nextOpen) => { if (!nextOpen) setSelectedTask(null); }}
          saving={tareas.saving}
          onStatus={changeStatus}
          onAddNote={addNote}
          onEdit={openEdit}
        />
      ) : null}
    </div>
  );
}
