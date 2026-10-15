import { ClipboardCheck, History } from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const items = [
  {
    to: "/asistencia/administracion/solicitudes",
    label: "Solicitudes pendientes",
    permission: PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES,
    icon: ClipboardCheck,
  },
  {
    to: "/asistencia/administracion/solicitudes/historial",
    label: "Historial de solicitudes",
    permission: PERMISSIONS.ASISTENCIA_VER_HISTORIAL_SOLICITUDES,
    icon: History,
  },
];

const activeClass = "border-emerald-300 bg-emerald-50 text-emerald-800";
const idleClass = "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-700";

export default function AttendanceRequestsNav() {
  const { profile } = useAuth();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Vistas de solicitudes de asistencia">
      {items
        .filter(({ permission }) => hasPermission(profile, permission))
        .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) => `inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors ${isActive ? activeClass : idleClass}`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
    </nav>
  );
}
