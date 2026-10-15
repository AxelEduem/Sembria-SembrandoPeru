import { Filter, LockKeyhole, Palette, Pin, StickyNote } from "lucide-react";

import ModuleManualPage from "@/components/manual/ModuleManualPage";

const SECTIONS = [
  {
    id: "vista-general",
    label: "Vista general",
    icon: StickyNote,
    number: "01 · Vista general",
    title: "Organiza tus apuntes privados",
    description: "El muro de notas personales reúne ideas y recordatorios vinculados únicamente a tu cuenta.",
    tone: "emerald",
    steps: [
      { title: "Revisa el muro", text: "Cada tarjeta presenta el título, una vista previa del contenido, el color y su última actualización." },
      { title: "Identifica notas fijadas", text: "El icono de chincheta indica las notas que se mantienen al inicio del muro." },
      { title: "Usa las acciones rápidas", text: "Desde cada tarjeta puedes fijar, editar o solicitar la eliminación de la nota." },
    ],
    tips: [{ tone: "emerald", text: "Estas notas son personales y no se comparten con responsables, supervisores ni otros integrantes." }],
  },
  {
    id: "crear-editar",
    label: "Crear y editar",
    icon: Palette,
    number: "02 · Crear y editar",
    title: "Registra una nueva nota",
    description: "El modal permite escribir el contenido y personalizar cómo se verá en el muro.",
    tone: "sky",
    steps: [
      { title: "Selecciona Nueva nota", text: "Se abrirá un modal sobre el muro sin cambiar de página." },
      { title: "Escribe el contenido", text: "Añade un título claro y el detalle que quieras conservar como referencia." },
      { title: "Elige un color", text: "Usa los colores disponibles para diferenciar visualmente temas o tipos de recordatorio." },
      { title: "Guarda o actualiza", text: "Al guardar, la tarjeta aparecerá en el muro; el botón Editar abre el mismo modal con la información actual." },
    ],
    tips: [{ tone: "amber", text: "No guardes contraseñas, credenciales ni otra información sensible dentro de una nota." }],
  },
  {
    id: "organizar",
    label: "Fijar y eliminar",
    icon: Pin,
    number: "03 · Organización",
    title: "Mantén tus notas importantes a la vista",
    description: "Fija los recordatorios prioritarios y elimina lo que ya no necesites.",
    tone: "violet",
    steps: [
      { title: "Fija una nota", text: "Presiona la chincheta de la tarjeta para moverla al inicio del muro." },
      { title: "Desfija cuando termine", text: "Vuelve a presionar el mismo control para devolverla al orden normal por actualización." },
      { title: "Solicita eliminar", text: "El icono de papelera abre un modal con el nombre y la vista previa de la nota." },
      { title: "Confirma con cuidado", text: "La eliminación es permanente y no puede deshacerse después de confirmarla." },
    ],
    tips: [{ tone: "rose", text: "Antes de eliminar, verifica el título y contenido mostrados en el diálogo de confirmación." }],
  },
  {
    id: "filtros-exportacion",
    label: "Filtros y Excel",
    icon: Filter,
    number: "04 · Filtros y exportación",
    title: "Localiza y respalda tus notas",
    description: "Los filtros reducen el muro y también determinan qué registros se incluyen al exportar.",
    tone: "amber",
    steps: [
      { title: "Busca por texto", text: "Encuentra coincidencias dentro del título o contenido de tus notas." },
      { title: "Filtra por color", text: "Muestra únicamente las notas asociadas al color seleccionado." },
      { title: "Filtra por fijación", text: "Consulta todas las notas, solo las fijadas o solamente las que están sin fijar." },
      { title: "Descarga Excel", text: "El archivo incluye las notas visibles, su color, estado de fijación y fechas." },
    ],
    tips: [
      { tone: "sky", text: "Usa Limpiar filtros para recuperar el muro completo antes de una exportación general." },
      { tone: "amber", text: "El archivo descargado contiene información personal; guárdalo en un lugar seguro." },
    ],
  },
];

export default function NotasManualPage() {
  return (
    <ModuleManualPage
      title="Manual de notas personales"
      description="Aprende a crear, organizar, buscar y exportar recordatorios privados dentro de tu agenda."
      estimatedTime="3 minutos"
      returnTo="/agenda/notas"
      returnLabel="Volver a notas personales"
      heroIcon={LockKeyhole}
      sections={SECTIONS}
    />
  );
}
