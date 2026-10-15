import { CalendarClock } from "lucide-react";

export default function EmptyDay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-8 py-6 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
          <CalendarClock className="h-4 w-4" strokeWidth={1.7} />
        </div>
        <p className="text-xs font-medium text-slate-400">Sin horarios este día</p>
      </div>
    </div>
  );
}