import {
  BriefcaseBusiness,
  Cake,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  ClipboardPen,
  Clock3,
  GraduationCap,
  Home,
  KeyRound,
  LayoutGrid,
  Megaphone,
  Network,
  ShieldCheck,
  ScrollText,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";

import { PERMISSIONS } from "@/utils/permissions";

export const NAVIGATION_GROUPS = [
  {
    label: "General",
    items: [{ to: "/inicio", label: "Inicio", icon: Home, always: true }],
  },
  {
    label: "Personas y organización",
    items: [
      {
        to: "/integrantes",
        label: "Integrantes",
        icon: Users,
        permission: PERMISSIONS.INTEGRANTES_VER,
      },
      {
        to: "/cumpleanos",
        label: "Cumpleaños",
        icon: Cake,
        permission: PERMISSIONS.CUMPLEANOS_VER,
      },
      { to: "/areas", label: "Áreas", icon: Network, permission: PERMISSIONS.AREAS_VER },
      {
        to: "/cargos",
        label: "Cargos",
        icon: BriefcaseBusiness,
        permission: PERMISSIONS.CARGOS_VER,
      },
    ],
  },
  {
    label: "Planificación y horarios",
    items: [
      { to: "/agenda", label: "Agenda", icon: CalendarRange, always: true },
      { to: "/mi-horario", label: "Mi horario", icon: Clock3, always: true },
      { to: "/horario", label: "Horario", icon: CalendarDays, always: true },
      {
        to: "/solicitudes-cambio-horario",
        label: "Solicitudes de horario",
        icon: ClipboardList,
        permission: PERMISSIONS.SOLICITUDES_HORARIO_VER,
      },
    ],
  },
  {
    label: "Asistencia",
    items: [
      { to: "/asistencia", label: "Mi asistencia", icon: UserCheck, always: true },
      {
        to: "/asistencia/administracion",
        label: "Gestión de asistencia",
        icon: ClipboardPen,
        permission: PERMISSIONS.ASISTENCIA_VER,
      },
    ],
  },
  {
    label: "Proyectos",
    items: [
      {
        to: "/gestion-proyectos/capacitacion",
        label: "Capacitación",
        icon: GraduationCap,
        permission: PERMISSIONS.GP_CAPACITACIONES_VER,
      },
      {
        to: "/gestion-proyectos/detecta/equipos",
        label: "Equipos",
        icon: UsersRound,
        permission: PERMISSIONS.GP_EQUIPOS_VER,
      },
      {
        to: "/gestion-proyectos/detecta/convocatorias",
        label: "Convocatorias",
        icon: Megaphone,
        permission: PERMISSIONS.GP_CONVOCATORIAS_VER,
      },
    ],
  },
  {
    label: "Administración",
    items: [
      { to: "/bitacora", label: "Bitácora", icon: ScrollText, permission: PERMISSIONS.BITACORA_VER },
      { to: "/accesos", label: "Accesos", icon: KeyRound, permission: PERMISSIONS.ACCESOS_VER },
      {
        to: "/aplicaciones",
        label: "Aplicaciones",
        icon: LayoutGrid,
        permission: PERMISSIONS.APLICACIONES_VER,
      },
      { to: "/usuarios", label: "Usuarios", icon: UserCog, permission: PERMISSIONS.USUARIOS_VER },
      {
        to: "/roles",
        label: "Roles y permisos",
        icon: ShieldCheck,
        permission: PERMISSIONS.ROLES_VER,
      },
    ],
  },
];
