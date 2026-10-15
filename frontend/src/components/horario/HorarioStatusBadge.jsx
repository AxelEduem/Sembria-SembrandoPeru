import { CheckCircle2, Clock3 } from "lucide-react";

export function HorarioTypeBadge({ type }) {
  const isPracticante = type === "practicante";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        isPracticante
          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      }`}
    >
      {isPracticante ? "Practicante" : "Voluntario"}
    </span>
  );
}

function HorarioStatusBadge({ hasSchedule }) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        hasSchedule
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-slate-50 text-slate-500 ring-1 ring-slate-200"
      }`}
    >
      {hasSchedule ? (
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
      ) : (
        <Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} />
      )}
      {hasSchedule ? "Con horario" : "Sin horario"}
    </span>
  );
}

export function HorarioEmptyBadge() {
  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
      <Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} />
      Sin horario
    </span>
  );
}

export default HorarioStatusBadge;
