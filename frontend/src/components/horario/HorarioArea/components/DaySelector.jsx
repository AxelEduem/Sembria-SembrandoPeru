export default function DaySelector({ dayData, selectedDay, onSelectDay }) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_3px_14px_rgba(15,23,42,0.035)]">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {dayData.map(({ day, groups, peopleCount }) => {
          const isActive = Number(day.value) === Number(selectedDay);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onSelectDay(day.value)}
              className={`relative flex min-h-[72px] items-center justify-center border-b border-r border-slate-100 px-4 py-3 text-center transition-all duration-200 last:border-r-0 sm:min-h-[78px] ${
                isActive ? "bg-emerald-50/80" : "bg-white hover:bg-slate-50"
              }`}
            >
              {isActive && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-emerald-500" />}
              <div>
                <p className={`text-xs font-bold transition-colors ${isActive ? "text-emerald-800" : "text-slate-700"}`}>
                  {day.label}
                </p>
                <p className={`mt-1 text-[9px] font-medium tracking-[0.08em] uppercase ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
                  {day.shortLabel}
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${groups.length > 0 ? (isActive ? "bg-emerald-500" : "bg-slate-300") : "bg-slate-200"}`} />
                  <span className={`text-[8px] font-medium ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                    {groups.length} {groups.length === 1 ? "horario" : "horarios"}
                  </span>
                  {peopleCount > 0 && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className={`text-[8px] font-medium ${isActive ? "text-emerald-700" : "text-slate-400"}`}>
                        {peopleCount} {peopleCount === 1 ? "persona" : "personas"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}