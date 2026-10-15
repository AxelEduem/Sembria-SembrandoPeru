import { ClipboardPenLine, Filter, ListTodo, MessageSquareText, UsersRound } from "lucide-react";

import ModuleManualPage from "@/components/manual/ModuleManualPage";

const SECTIONS = [
  {
    id: "vista-general",
    label: "Vista general",
    icon: ListTodo,
    number: "01 · Vista general",
    title: "Comprende el muro de tareas",
    description: "Consulta en un solo lugar las tareas que recibiste y las que asignaste a integrantes de tu área.",
    tone: "emerald",
    steps: [
      { title: "Revisa cada tarjeta", text: "La tarjeta muestra prioridad, estado, responsables, fecha límite y cantidad de notas de seguimiento. Presiona la foto de una persona para ampliarla." },
      { title: "Distingue tu participación", text: "Puedes identificar si eres responsable de completar la tarea o si la asignaste para monitorear su avance." },
      { title: "Abre el detalle", text: "Presiona cualquier parte de la tarjeta para consultar la descripción, cambiar estados y revisar el historial de notas." },
    ],
    tips: [{ tone: "emerald", text: "Las tareas asignadas por ti permanecen visibles para que puedas monitorearlas hasta su cierre." }],
  },
  {
    id: "crear",
    label: "Asignar tarea",
    icon: ClipboardPenLine,
    number: "02 · Asignar tarea",
    title: "Crea una tarea para tu equipo",
    description: "Define claramente el trabajo, las personas responsables, la prioridad y el plazo esperado.",
    tone: "sky",
    steps: [
      { title: "Selecciona Nueva tarea", text: "El formulario se abrirá en un modal sin abandonar el muro de tareas." },
      { title: "Completa la información", text: "Escribe un título y descripción, selecciona uno o más integrantes de tu misma área y asigna una prioridad." },
      { title: "Define la fecha límite", text: "La fecha es opcional, pero ayuda al responsable a organizar sus pendientes." },
      { title: "Guarda la tarea", text: "Cada persona responsable recibirá la tarea y tú podrás seguir viéndola en la vista de asignadas." },
    ],
    tips: [{ tone: "amber", text: "Solo puedes asignar tareas a integrantes activos de tu misma área institucional." }],
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    icon: MessageSquareText,
    number: "03 · Seguimiento",
    title: "Actualiza y monitorea el avance",
    description: "Los estados y notas permiten mantener una comunicación clara sobre el progreso de cada tarea.",
    tone: "violet",
    steps: [
      { title: "Inicia el trabajo", text: "El responsable puede cambiar una tarea pendiente a En progreso desde su detalle." },
      { title: "Agrega notas", text: "Responsable y creador pueden registrar comentarios para documentar avances, acuerdos o bloqueos." },
      { title: "Marca como completada", text: "Cuando el trabajo termine, el responsable puede cerrar la tarea desde la tarjeta o el detalle." },
      { title: "Edita o cancela", text: "La persona que creó la tarea puede editarla mientras esté pendiente. Al iniciar el trabajo, su información queda bloqueada, aunque todavía puede cancelarla." },
    ],
    tips: [{ tone: "emerald", text: "Usa las notas para registrar información de seguimiento; no sustituyen a tus notas personales privadas." }],
  },
  {
    id: "filtros",
    label: "Filtros y Excel",
    icon: Filter,
    number: "04 · Filtros y exportación",
    title: "Encuentra y exporta la información",
    description: "Combina filtros para reducir el muro a las tareas que necesitas revisar.",
    tone: "amber",
    steps: [
      { title: "Busca por texto", text: "Localiza tareas por título, descripción o nombre de los integrantes relacionados." },
      { title: "Combina los filtros", text: "Filtra por participación, estado, prioridad y fecha límite." },
      { title: "Limpia la consulta", text: "Usa Limpiar filtros para regresar rápidamente a la vista inicial." },
      { title: "Descarga Excel", text: "La exportación incluye únicamente las tareas visibles con los filtros actuales." },
    ],
    tips: [{ tone: "sky", text: "El archivo Excel incluye responsables, estados, fechas y cantidad de notas de seguimiento." }],
  },
];

export default function TareasManualPage() {
  return (
    <ModuleManualPage
      title="Manual del módulo de tareas"
      description="Aprende a asignar responsabilidades, registrar avances y monitorear el trabajo compartido con tu área."
      estimatedTime="4 minutos"
      returnTo="/agenda/tareas"
      returnLabel="Volver a tareas"
      heroIcon={UsersRound}
      sections={SECTIONS}
    />
  );
}
