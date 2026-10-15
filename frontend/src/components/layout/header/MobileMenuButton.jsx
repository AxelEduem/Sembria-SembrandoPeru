import { Menu, X } from "lucide-react";

function MobileMenuButton({ open, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={open ? "Cerrar menú principal" : "Abrir menú principal"} aria-expanded={open} aria-controls="main-sidebar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 lg:hidden">
      {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
    </button>
  );
}

export default MobileMenuButton;
