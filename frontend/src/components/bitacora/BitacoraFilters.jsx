import { CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass = "h-10 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pr-8 pl-9 text-sm text-slate-700 outline-none transition-none hover:border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

function SelectIcon() {
  return <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />;
}

export default function BitacoraFilters({ filters, catalogs, onChange, onClear }) {
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => !["page", "per_page"].includes(key) && value && value !== "todos",
  );

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.7fr)_minmax(220px,1fr)_minmax(220px,1fr)] lg:items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input value={filters.q} onChange={(event) => onChange("q", event.target.value)} placeholder="Buscar por usuario, correo, descripción o entidad..." className="h-10 w-full rounded-xl border-slate-200 bg-slate-50/60 pl-9 text-sm shadow-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
          </div>
          <div className="relative w-full">
            <SelectIcon />
            <select value={filters.modulo} onChange={(event) => onChange("modulo", event.target.value)} className={selectClass} aria-label="Módulo">
              <option value="todos">Selecciona un módulo</option>
              {catalogs.modulos.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </div>
          <div className="relative w-full">
            <SelectIcon />
            <select value={filters.accion} onChange={(event) => onChange("accion", event.target.value)} className={selectClass} aria-label="Acción">
              <option value="todos">Selecciona una acción</option>
              {catalogs.acciones.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-center">
          <div className="relative w-full">
            <SelectIcon />
            <select value={filters.resultado} onChange={(event) => onChange("resultado", event.target.value)} className={selectClass} aria-label="Resultado">
              <option value="todos">Selecciona un resultado</option>
              <option value="exitoso">Exitoso</option>
              <option value="error">Con error</option>
            </select>
          </div>
          <div className="relative w-full">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input type="date" value={filters.desde} onChange={(event) => onChange("desde", event.target.value)} className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" aria-label="Desde" />
          </div>
          <div className="relative w-full">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.8} />
            <Input type="date" value={filters.hasta} onChange={(event) => onChange("hasta", event.target.value)} className="h-10 w-full rounded-xl border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-700 shadow-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" aria-label="Hasta" />
          </div>
          <Button type="button" variant="outline" onClick={onClear} disabled={!hasFilters} className={`h-10 w-full gap-2 rounded-xl px-4 text-sm font-medium shadow-none transition-none lg:w-auto ${hasFilters ? "border-red-200 bg-white text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600" : "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"}`}>
            <X className="h-4 w-4" strokeWidth={1.8} />
            Limpiar filtros
          </Button>
        </div>
      </div>
    </section>
  );
}
