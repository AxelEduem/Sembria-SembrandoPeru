import HorarioInfo from "./HorarioInfo";
import HorarioStats from "./HorarioStats";

export default function HorarioHeader({
  weeklyHours,
  periodHours,
  canSelect,
  error,
  showPeriodHours,
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <HorarioInfo canSelect={canSelect} />

        <HorarioStats
          weeklyHours={weeklyHours}
          periodHours={periodHours}
          showPeriodHours={showPeriodHours}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}
    </section>
  );
}
