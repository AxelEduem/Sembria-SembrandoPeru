import { Link } from "react-router-dom";

function isRouteActive(pathname, route) {
  // “Mi asistencia” solo se activa en su ruta exacta.
  if (route === "/asistencia") {
    return pathname === "/asistencia";
  }

  // Las demás opciones pueden reconocer subrutas.
  return pathname === route || pathname.startsWith(`${route}/`);
}

function SidebarNavItem({ item, pathname, collapsed, onNavigate }) {
  const active = isRouteActive(pathname, item.to);
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-label={item.label}
      title={collapsed ? item.label : undefined}
      className={`group relative flex min-w-0 items-center rounded-xl transition-all duration-300 ease-out ${collapsed ? "h-10 justify-center gap-0 px-0" : "h-10 gap-2.5 px-2.5"} ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
    >
      {active && <span aria-hidden="true" className="absolute top-1/2 left-0 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-500" />}
      <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-emerald-600" : "text-slate-400 group-hover:text-slate-700"}`} strokeWidth={1.8} />
      <span className={`min-w-0 overflow-hidden truncate text-[13px] font-medium transition-all duration-200 ease-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}>{item.label}</span>
      {!collapsed && active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
      {collapsed && <span role="tooltip" className="pointer-events-none absolute left-[calc(100%+10px)] z-50 hidden whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg group-hover:block group-focus-visible:block">{item.label}</span>}
    </Link>
  );
}

export default SidebarNavItem;
