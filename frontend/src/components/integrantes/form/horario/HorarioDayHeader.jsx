export default function HorarioDayHeader({
  day,
}) {
  return (
    <div className="flex items-center justify-center border-r border-slate-200 px-3 py-4 text-center last:border-r-0">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {day.label}
        </p>

        <p className="mt-0.5 text-[11px] text-slate-400">
          {day.shortLabel}
        </p>
      </div>
    </div>
  );
}