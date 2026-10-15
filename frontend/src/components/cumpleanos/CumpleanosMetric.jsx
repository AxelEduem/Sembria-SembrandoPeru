function CumpleanosMetric({ label, value, icon: Icon, hint, loading = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_5px_16px_rgba(15,23,42,0.06)] min-h-[100px]">
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            {label}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
          ) : (
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
          )}

          {hint && !loading ? (
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
          ) : loading ? (
            <div className="mt-1 h-3 w-32 animate-pulse rounded bg-slate-100" />
          ) : null}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </div>
      </div>
    </div>
  );
}

export default CumpleanosMetric;