import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

function SidebarToggle({ collapsed, onToggle, mobile = false }) {
  if (mobile) {
    return <button type="button" onClick={onToggle} aria-label="Cerrar menú" title="Cerrar menú" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-emerald-200 hover:text-emerald-700 lg:hidden"><X className="h-4 w-4" /></button>;
  }

  return <button type="button" onClick={onToggle} title={collapsed ? "Expandir menú" : "Contraer menú"} aria-label={collapsed ? "Expandir menú" : "Contraer menú"} className="absolute top-1/2 -right-3 z-50 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1/2 hover:border-emerald-200 hover:text-emerald-600 hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 max-lg:hidden">{collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}</button>;
}

export default SidebarToggle;
