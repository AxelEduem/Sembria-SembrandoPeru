import { BarChart3, CalendarOff, ClipboardCheck, Settings2, ShieldAlert } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import ExcelIcon from "@/components/ui/ExcelIcon";
import ManualButton from "@/components/ui/ManualButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, PERMISSIONS } from "@/utils/permissions";

const items = [
  {
    to: "/asistencia/administracion/configuracion",
    label: "Configuración",
    permission: PERMISSIONS.ASISTENCIA_GESTIONAR_CONFIGURACION,
    icon: Settings2,
    active: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900",
    idle: "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900",
  },
  {
    to: "/asistencia/administracion/feriados",
    label: "Feriados",
    permission: PERMISSIONS.ASISTENCIA_GESTIONAR_CONFIGURACION,
    icon: CalendarOff,
    active: "border-teal-300 bg-teal-50 text-teal-800",
    idle: "border-teal-200 bg-white text-teal-700 hover:bg-teal-50",
  },
  {
    to: (profile) => hasPermission(profile, PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES)
      ? "/asistencia/administracion/solicitudes"
      : "/asistencia/administracion/solicitudes/historial",
    label: "Solicitudes",
    permissions: [
      PERMISSIONS.ASISTENCIA_GESTIONAR_SOLICITUDES,
      PERMISSIONS.ASISTENCIA_VER_HISTORIAL_SOLICITUDES,
    ],
    icon: ClipboardCheck,
    end: false,
    active: "border-emerald-300 bg-emerald-50 text-emerald-800",
    idle: "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  },
  {
    to: "/asistencia/administracion/amonestaciones",
    label: "Amonestaciones",
    permission: PERMISSIONS.ASISTENCIA_GESTIONAR_AMONESTACIONES,
    icon: ShieldAlert,
    active: "border-amber-300 bg-amber-50 text-amber-800",
    idle: "border-amber-200 bg-white text-amber-700 hover:bg-amber-50",
  },
  {
    to: "/asistencia/administracion/metricas",
    permission: PERMISSIONS.ASISTENCIA_VER_METRICAS,
    label: "Métricas",
    icon: BarChart3,
    active: "border-blue-300 bg-blue-50 text-blue-800",
    idle: "border-blue-200 bg-white text-blue-700 hover:bg-blue-50",
  },
];

export default function AttendanceAdminNav({ onExport, exportDisabled = false, exporting = false }) {
  const location = useLocation();
  const { profile } = useAuth();
  const visibleItems = items.filter(({ permission, permissions }) =>
    (!permission || hasPermission(profile, permission))
    && (!permissions || permissions.some((code) => hasPermission(profile, code))));

  return (
    <nav
      className="module-section-enter module-enter-delay-1 flex flex-wrap justify-end gap-2"
      aria-label="Administración de asistencia"
    >
      {visibleItems.map(({ to, label, icon: Icon, active, idle, end = true }) => {
        const destination = typeof to === "function" ? to(profile) : to;
        return (
          <NavLink
            key={label}
            to={destination}
            end={end}
            className={({ isActive }) =>
              `inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium shadow-none transition-colors ${
                isActive ? active : idle
              }`
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </NavLink>
        );
      })}
      <ManualButton
        to="/asistencia/administracion/manual"
        state={{ listSearch: location.search }}
      />
      {onExport && hasPermission(profile, PERMISSIONS.ASISTENCIA_DESCARGAR_EXCEL) ? (
        <Button
          type="button"
          variant="outline"
          onClick={onExport}
          disabled={exportDisabled || exporting}
          className="h-10 gap-2 rounded-xl px-4 text-sm font-medium shadow-none"
        >
          <ExcelIcon className="h-4 w-4" />
          {exporting ? "Exportando..." : "Descargar Excel"}
        </Button>
      ) : null}
    </nav>
  );
}
