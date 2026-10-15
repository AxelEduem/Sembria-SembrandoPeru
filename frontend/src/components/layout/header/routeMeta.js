import {
  AppWindow,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  GraduationCap,
  History,
  Home,
  KeyRound,
  ListTodo,
  StickyNote,
  Shield,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  UserPlus,
  UserRound,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";

const PARTICIPANT_SECTIONS = {
  integrantes: {
    title: "Integrantes",
    singular: "integrante",
    description: "Gestión de perfiles, contratos y estado institucional.",
  },
  voluntarios: {
    title: "Voluntarios",
    singular: "voluntario",
    description: "Gestión de voluntarios, periodos y horarios institucionales.",
  },
  practicantes: {
    title: "Practicantes",
    singular: "practicante",
    description: "Gestión de practicantes, periodos y horarios institucionales.",
  },
};

function participantRoute(section, page = "list") {
  const config = PARTICIPANT_SECTIONS[section];
  const basePath = `/${section}`;

  if (page === "new") {
    return {
      title: `Nuevo ${config.singular}`,
      description: `Registra un nuevo ${config.singular} y configura su periodo y horario institucional.`,
      icon: UserPlus,
      breadcrumb: [{ label: config.title, to: basePath }, { label: `Nuevo ${config.singular}` }],
    };
  }

  if (page === "detail") {
    return {
      title: `Detalle de ${config.singular}`,
      description: `Consulta la información, horario e historial del ${config.singular}.`,
      icon: UserPlus,
      breadcrumb: [
        { label: config.title, to: basePath },
        { label: `Detalle de ${config.singular}` },
      ],
    };
  }

  if (page === "edit") {
    return {
      title: `Editar ${config.singular}`,
      description: `Actualiza los datos, periodo y horario del ${config.singular}.`,
      icon: UserPlus,
      breadcrumb: [{ label: config.title, to: basePath }, { label: `Editar ${config.singular}` }],
    };
  }

  if (page === "rehire") {
    return {
      title: `Recontratar ${config.singular}`,
      description: `Registra un nuevo periodo de participación para el ${config.singular}.`,
      icon: RefreshCw,
      breadcrumb: [
        { label: config.title, to: basePath },
        { label: `Recontratar ${config.singular}` },
      ],
    };
  }

  return {
    title: config.title,
    description: config.description,
    icon: Users,
    breadcrumb: [{ label: config.title }],
  };
}

export const ROUTE_META = {
  "/inicio": {
    title: "Inicio",
    description: "Vista general de Sembria.",
    icon: Home,
    breadcrumb: [{ label: "Inicio" }],
  },
  "/agenda": {
    title: "Agenda",
    description: "Organiza tus tareas, notas personales y reuniones en un solo lugar.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Agenda" }],
  },
  "/agenda/tareas": {
    title: "Tareas",
    description: "Organiza tus pendientes y da seguimiento a las tareas compartidas.",
    icon: ListTodo,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Tareas" }],
  },
  "/agenda/tareas/manual": {
    title: "Manual de tareas",
    description: "Guía para asignar, actualizar y monitorear tareas compartidas.",
    icon: BookOpen,
    breadcrumb: [
      { label: "Agenda", to: "/agenda" },
      { label: "Tareas", to: "/agenda/tareas" },
      { label: "Manual" },
    ],
  },
  "/agenda/notas": {
    title: "Notas personales",
    description: "Guarda ideas y recordatorios privados vinculados a tu cuenta.",
    icon: StickyNote,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Notas" }],
  },
  "/agenda/notas/manual": {
    title: "Manual de notas personales",
    description: "Guía para crear, organizar y exportar tus notas privadas.",
    icon: BookOpen,
    breadcrumb: [
      { label: "Agenda", to: "/agenda" },
      { label: "Notas", to: "/agenda/notas" },
      { label: "Manual" },
    ],
  },
  "/agenda/reuniones": {
    title: "Reuniones",
    description: "Coordina reuniones según la disponibilidad del equipo.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Reuniones" }],
  },
  "/agenda/reuniones/historial": {
    title: "Historial de reuniones",
    description: "Consulta tus reuniones finalizadas y solicitudes cerradas.",
    icon: CalendarDays,
    breadcrumb: [
      { label: "Agenda", to: "/agenda" },
      { label: "Reuniones", to: "/agenda/reuniones" },
      { label: "Historial" },
    ],
  },
  "/agenda/reuniones/metricas": {
    title: "Métricas de reuniones",
    description: "Analiza las reuniones confirmadas que has tenido.",
    icon: BarChart3,
    breadcrumb: [
      { label: "Agenda", to: "/agenda" },
      { label: "Reuniones", to: "/agenda/reuniones" },
      { label: "Métricas" },
    ],
  },
  "/agenda/reuniones/manual": {
    title: "Manual de reuniones",
    description: "Guía para organizar, responder y gestionar reuniones.",
    icon: CalendarDays,
    breadcrumb: [
      { label: "Agenda", to: "/agenda" },
      { label: "Reuniones", to: "/agenda/reuniones" },
      { label: "Manual" },
    ],
  },
  "/agenda/historial": {
    title: "Historial de reuniones",
    description: "Consulta tus reuniones finalizadas y solicitudes cerradas.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Historial" }],
  },
  "/agenda/metricas": {
    title: "Métricas de reuniones",
    description: "Analiza las reuniones confirmadas que has tenido.",
    icon: BarChart3,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Métricas" }],
  },
  "/agenda/manual": {
    title: "Manual de agenda",
    description: "Guía para organizar, responder y gestionar reuniones.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Agenda", to: "/agenda" }, { label: "Manual" }],
  },
  "/tareas": {
    title: "Tareas",
    description: "Organiza tus pendientes y da seguimiento a las tareas compartidas.",
    icon: ListTodo,
    breadcrumb: [{ label: "Tareas" }],
  },
  "/integrantes": participantRoute("integrantes"),
  "/integrantes/metricas": {
    title: "Métricas de integrantes",
    description: "Indicadores y distribuciones exclusivas del módulo de integrantes.",
    icon: BarChart3,
    breadcrumb: [{ label: "Integrantes", to: "/integrantes" }, { label: "Métricas" }],
  },
  "/integrantes/nuevo": participantRoute("integrantes", "new"),
  "/integrantes/:id": participantRoute("integrantes", "detail"),
  "/integrantes/:id/editar": participantRoute("integrantes", "edit"),
  "/voluntarios": participantRoute("voluntarios"),
  "/voluntarios/nuevo": participantRoute("voluntarios", "new"),
  "/practicantes": participantRoute("practicantes"),
  "/practicantes/nuevo": participantRoute("practicantes", "new"),
  "/accesos": {
    title: "Accesos",
    description: "Asignación y control de herramientas institucionales.",
    icon: Shield,
    breadcrumb: [{ label: "Accesos" }],
  },
  "/bitacora": {
    title: "Bitácora",
    description: "Trazabilidad de las operaciones institucionales realizadas en Sembria.",
    icon: ScrollText,
    breadcrumb: [{ label: "Bitácora" }],
  },
  "/bitacora/metricas": {
    title: "Métricas de bitácora",
    description: "Analiza la actividad, efectividad y trazabilidad de las operaciones institucionales.",
    icon: BarChart3,
    breadcrumb: [{ label: "Bitácora", to: "/bitacora" }, { label: "Métricas" }],
  },
  "/bitacora/manual": {
    title: "Manual de bitácora",
    description: "Guía para consultar, analizar y exportar la trazabilidad institucional.",
    icon: BookOpen,
    breadcrumb: [{ label: "Bitácora", to: "/bitacora" }, { label: "Manual" }],
  },
  "/accesos/metricas": {
    title: "Métricas de accesos",
    description: "Analiza la cobertura y distribución de los accesos institucionales.",
    icon: BarChart3,
    breadcrumb: [{ label: "Accesos", to: "/accesos" }, { label: "Métricas" }],
  },
  "/accesos/inactivos": {
    title: "Integrantes inactivos con acceso",
    description: "Revisa y retira accesos que permanecen asignados a integrantes inactivos.",
    icon: Shield,
    breadcrumb: [{ label: "Accesos", to: "/accesos" }, { label: "Inactivos con acceso" }],
  },
  "/aplicaciones": {
    title: "Aplicaciones",
    description: "Catálogo de herramientas y licencias disponibles.",
    icon: AppWindow,
    breadcrumb: [{ label: "Aplicaciones" }],
  },
  "/aplicaciones/manual": {
    title: "Manual de aplicaciones",
    description: "Guía para consultar y administrar herramientas institucionales.",
    icon: AppWindow,
    breadcrumb: [{ label: "Aplicaciones", to: "/aplicaciones" }, { label: "Manual" }],
  },
  "/mi-horario": {
    title: "Mi horario",
    description: "Consulta tu horario personal y tus bloques asignados.",
    icon: Clock3,
    breadcrumb: [{ label: "Mi horario" }],
  },
  "/mi-horario/historial": {
    title: "Historial de horario",
    description: "Consulta y filtra los horarios registrados en tus distintos periodos.",
    icon: History,
    breadcrumb: [{ label: "Mi horario", to: "/mi-horario" }, { label: "Historial" }],
  },
  "/cambiar-horario": {
    title: "Historial de solicitudes",
    description: "Consulta y filtra tus solicitudes de cambio de horario.",
    icon: History,
    breadcrumb: [{ label: "Mi horario", to: "/mi-horario" }, { label: "Historial" }],
  },
  "/cambiar-horario/nuevo": {
    title: "Solicitar cambio de horario",
    description: "Propón un nuevo horario para revisión y aprobación.",
    icon: Clock3,
    breadcrumb: [
      { label: "Mi horario", to: "/mi-horario" },
      { label: "Historial", to: "/cambiar-horario" },
      { label: "Nueva solicitud" },
    ],
  },
  "/horario": {
    title: "Horario",
    description: "Gestión y consulta del horario institucional.",
    icon: Clock3,
    breadcrumb: [{ label: "Horario" }],
  },
  "/solicitudes-cambio-horario": {
    title: "Solicitudes de horario",
    description: "Revisa y resuelve las solicitudes de cambio de horario dentro de tu alcance.",
    icon: ClipboardList,
    breadcrumb: [{ label: "Solicitudes de horario" }],
  },
  "/solicitudes-cambio-horario/manual": {
    title: "Manual de solicitudes de horario",
    description: "Guía para consultar, filtrar y resolver solicitudes de cambio de horario.",
    icon: ClipboardList,
    breadcrumb: [
      { label: "Solicitudes de horario", to: "/solicitudes-cambio-horario" },
      { label: "Manual" },
    ],
  },
  "/horario/manual": {
    title: "Manual de horario",
    description: "Guía para consultar y analizar el horario institucional.",
    icon: Clock3,
    breadcrumb: [{ label: "Horario", to: "/horario" }, { label: "Manual" }],
  },
  "/cumpleanos": {
    title: "Cumpleaños",
    description: "Seguimiento de cumpleaños próximos y filtrados.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Cumpleaños" }],
  },
  "/cumpleanos/metricas": {
    title: "Métricas de cumpleaños",
    description: "Indicadores y distribución de los cumpleaños registrados.",
    icon: BarChart3,
    breadcrumb: [{ label: "Cumpleaños", to: "/cumpleanos" }, { label: "Métricas" }],
  },
  "/cumpleanos/manual": {
    title: "Manual de cumpleaños",
    description: "Guía para consultar, filtrar y planificar los próximos cumpleaños.",
    icon: CalendarDays,
    breadcrumb: [{ label: "Cumpleaños", to: "/cumpleanos" }, { label: "Manual" }],
  },
  "/areas": {
    title: "Áreas",
    description: "Organización de áreas internas del programa.",
    icon: Building2,
    breadcrumb: [{ label: "Áreas" }],
  },
  "/cargos": {
    title: "Cargos",
    description: "Cargos institucionales asociados por área.",
    icon: BriefcaseBusiness,
    breadcrumb: [{ label: "Cargos" }],
  },
  "/roles": {
    title: "Roles y permisos",
    description: "Gestiona los roles y define los permisos de acceso al sistema.",
    icon: ShieldCheck,
    breadcrumb: [{ label: "Roles y permisos" }],
  },
  "/usuarios": {
    title: "Usuarios",
    description: "Configura y administra el acceso al sistema de los integrantes.",
    icon: UserCog,
    breadcrumb: [{ label: "Usuarios" }],
  },
  "/asistencia": {
    title: "Asistencia",
    description: "Gestión y seguimiento de asistencia dentro de Sembria.",
    icon: ClipboardCheck,
    breadcrumb: [{ label: "Asistencia" }],
  },
  "/asistencia/manual": {
    title: "Manual de Mi asistencia",
    description: "Aprende a registrar jornadas, justificar faltas y solicitar permisos.",
    icon: BookOpen,
    breadcrumb: [{ label: "Mi asistencia", to: "/asistencia" }, { label: "Manual" }],
  },
  "/asistencia/historial": {
    title: "Calendario de asistencia",
    description: "Consulta tus jornadas y estados de asistencia en el calendario.",
    icon: History,
    breadcrumb: [{ label: "Mi asistencia", to: "/asistencia" }, { label: "Calendario" }],
  },
  "/asistencia/solicitudes": {
    title: "Solicitudes de asistencia",
    description: "Consulta el estado de tus permisos y sus planes de recuperación.",
    icon: ClipboardList,
    breadcrumb: [{ label: "Mi asistencia", to: "/asistencia" }, { label: "Solicitudes" }],
  },
  "/asistencia/solicitudes/nueva": {
    title: "Solicitar permiso",
    description: "Registra el permiso y programa sus horas de recuperación.",
    icon: ClipboardList,
    breadcrumb: [
      { label: "Mi asistencia", to: "/asistencia" },
      { label: "Solicitudes", to: "/asistencia/solicitudes" },
      { label: "Nueva solicitud" },
    ],
  },
  "/asistencia/faltas": {
    title: "Faltas de asistencia",
    description: "Consulta tus inasistencias y presenta una justificación cuando corresponda.",
    icon: Shield,
    breadcrumb: [{ label: "Mi asistencia", to: "/asistencia" }, { label: "Faltas" }],
  },
  "/asistencia/administracion": {
    title: "Gestión de asistencia",
    description: "Supervisa el estado diario de las jornadas del equipo.",
    icon: ClipboardCheck,
    breadcrumb: [{ label: "Gestión de asistencia" }],
  },
  "/asistencia/administracion/metricas": {
    title: "Métricas de asistencia",
    description: "Analiza el cumplimiento, las incidencias y las faltas del equipo.",
    icon: BarChart3,
    breadcrumb: [
      { label: "Gestión de asistencia", to: "/asistencia/administracion" },
      { label: "Métricas" },
    ],
  },
  "/asistencia/administracion/configuracion": {
    title: "Configuración de asistencia",
    description: "Define las reglas y fechas que utiliza el control de asistencia.",
    icon: ClipboardCheck,
    breadcrumb: [
      { label: "Gestión de asistencia", to: "/asistencia/administracion" },
      { label: "Configuración" },
    ],
  },
  "/asistencia/administracion/solicitudes": {
    title: "Solicitudes de asistencia",
    description: "Revisa permisos y justificaciones enviadas por los integrantes.",
    icon: ClipboardCheck,
    breadcrumb: [
      { label: "Gestión de asistencia", to: "/asistencia/administracion" },
      { label: "Solicitudes" },
    ],
  },
  "/asistencia/administracion/solicitudes/historial": {
    title: "Historial de solicitudes",
    description: "Consulta las solicitudes de asistencia aprobadas y denegadas.",
    icon: History,
    breadcrumb: [
      { label: "Gestión de asistencia", to: "/asistencia/administracion" },
      { label: "Solicitudes" },
    ],
  },
  "/gestion-proyectos/detecta/convocatorias": {
    title: "Convocatorias",
    description: "Registro y evaluación inicial de oportunidades de financiamiento.",
    icon: ClipboardList,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Convocatorias" },
    ],
  },
  "/gestion-proyectos/capacitacion": {
    title: "Capacitación",
    description: "Avance formativo de los miembros de Gestión de Proyectos.",
    icon: GraduationCap,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Capacitación" },
    ],
  },
  "/gestion-proyectos/detecta/convocatorias/manual": {
    title: "Manual de convocatorias",
    description: "Guía para consultar y gestionar convocatorias según los permisos del perfil.",
    icon: BookOpen,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Convocatorias", to: "/gestion-proyectos/detecta/convocatorias" },
      { label: "Manual" },
    ],
  },
  "/gestion-proyectos/detecta/equipos": {
    title: "Equipos",
    description: "Organiza los equipos responsables de las convocatorias.",
    icon: UsersRound,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Equipos" },
    ],
  },
  "/gestion-proyectos/detecta/equipos/nuevo": {
    title: "Registrar equipo",
    description: "Define al líder y los integrantes del nuevo equipo de convocatorias.",
    icon: UserPlus,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Equipos", to: "/gestion-proyectos/detecta/equipos" },
      { label: "Registrar equipo" },
    ],
  },
  "/gestion-proyectos/detecta/equipos/manual": {
    title: "Manual de equipos",
    description: "Guía para consultar, organizar y analizar los equipos de convocatorias.",
    icon: BookOpen,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Equipos", to: "/gestion-proyectos/detecta/equipos" },
      { label: "Manual" },
    ],
  },
  "/gestion-proyectos/detecta/equipos/metricas": {
    title: "Métricas de equipos",
    description: "Analiza la efectividad y resultados de los equipos de convocatorias.",
    icon: BarChart3,
    breadcrumb: [
      { label: "Gestión de Proyectos" },
      { label: "Detecta" },
      { label: "Equipos", to: "/gestion-proyectos/detecta/equipos" },
      { label: "Métricas" },
    ],
  },
  "/perfil-administracion": {
    title: "Perfil de administración",
    description: "Información y preferencias de tu cuenta.",
    icon: UserRound,
    breadcrumb: [{ label: "Perfil de administración" }],
  },
  "/seguridad": {
    title: "Seguridad",
    description: "Actualiza la contraseña de tu cuenta.",
    icon: KeyRound,
    breadcrumb: [{ label: "Seguridad" }],
  },
};

export const DEFAULT_ROUTE_META = {
  title: "Sembria",
  description: "Plataforma institucional de Sembrando Perú.",
  icon: KeyRound,
  breadcrumb: [{ label: "Sembria" }],
};

function resolveParticipantRoute(pathname) {
  for (const section of Object.keys(PARTICIPANT_SECTIONS)) {
    const basePath = `/${section}`;

    if (pathname === basePath) return participantRoute(section);
    if (pathname === `${basePath}/nuevo`) return participantRoute(section, "new");
    if (pathname.startsWith(`${basePath}/`) && pathname.endsWith("/editar")) {
      return participantRoute(section, "edit");
    }
    if (pathname.startsWith(`${basePath}/`) && pathname.endsWith("/recontratar")) {
      return participantRoute(section, "rehire");
    }
    if (pathname.startsWith(`${basePath}/`)) return participantRoute(section, "detail");
  }

  return null;
}

function resolveProjectRoute(pathname) {
  const basePath = "/gestion-proyectos/detecta/convocatorias";
  if (!pathname.startsWith(basePath)) return null;
  const breadcrumb = [
    { label: "Gestión de Proyectos" },
    { label: "Detecta" },
    { label: "Convocatorias", to: basePath },
  ];
  if (pathname === `${basePath}/nueva`) breadcrumb.push({ label: "Nueva" });
  else if (pathname.endsWith("/editar")) breadcrumb.push({ label: "Editar convocatoria" });
  else if (pathname !== basePath) breadcrumb.push({ label: "Detalle" });
  return {
    title: breadcrumb.at(-1).label,
    description: "Gestión de oportunidades de financiamiento.",
    icon: ClipboardList,
    breadcrumb,
  };
}

export function getRouteMeta(pathname) {
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];

  const participantMatch = resolveParticipantRoute(pathname);
  if (participantMatch) return participantMatch;

  const projectMatch = resolveProjectRoute(pathname);
  if (projectMatch) return projectMatch;

  const parentRoute = Object.keys(ROUTE_META).find((route) => pathname.startsWith(`${route}/`));

  return parentRoute ? ROUTE_META[parentRoute] : DEFAULT_ROUTE_META;
}
