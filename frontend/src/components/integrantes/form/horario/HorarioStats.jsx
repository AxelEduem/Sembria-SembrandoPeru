function formatHours(hours) {
  const value =
    Math.round(Number(hours || 0) * 100) / 100;

  if (Number.isInteger(value)) {
    return `${value} ${
      value === 1 ? "hora" : "horas"
    }`;
  }

  return `${value
    .toFixed(2)
    .replace(/\.?0+$/, "")} horas`;
}

function StatCard({
  label,
  value,
  description,
}) {
  return (
    <div className="min-w-[145px] rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-lg font-bold leading-none text-slate-900">
        {formatHours(value)}
      </p>

      <p className="mt-1 text-[10px] text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function HorarioStats({
  weeklyHours,
  periodHours,
  showPeriodHours = true,
}) {
  return (
    <div className="flex shrink-0 gap-3 lg:justify-end">
      <StatCard
        label="Horas semanales"
        value={weeklyHours}
        description="Cada semana"
      />

      {showPeriodHours && (
        <StatCard
          label="Horas del período"
          value={periodHours}
          description="Periodo seleccionado"
        />
      )}
    </div>
  );
}
