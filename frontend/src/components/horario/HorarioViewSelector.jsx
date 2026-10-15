import { Building2, ListFilter } from "lucide-react";

function HorarioViewSelector({ viewMode, onViewModeChange }) {
  const options = [
    {
      value: "listado",
      label: "Todos los horarios",
      icon: ListFilter,
    },
    {
      value: "area",
      label: "Horario por área",
      icon: Building2,
    },
  ];

  return (
    <div className="flex justify-end">
      <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
        {options.map(({ value, label, icon: Icon }) => {
          const active = viewMode === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => onViewModeChange(value)}
              className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all duration-200 sm:flex-none ${
                active
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${active ? "text-emerald-600" : "text-slate-400"}`}
                strokeWidth={1.8}
              />

              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default HorarioViewSelector;
