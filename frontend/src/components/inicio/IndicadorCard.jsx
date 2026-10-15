function IndicadorCard({ label, value, icon: Icon, detail, loading }) {
  return (
    <div className="group min-w-0 rounded-2xl border border-emerald-100 bg-white/95 p-5 shadow-[0_5px_22px_rgba(45,90,61,0.055)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_8px_28px_rgba(45,90,61,0.09)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100 sm:h-11 sm:w-11">
          <Icon className="h-5 w-5" />
        </div>

        <span className="shrink-0 text-3xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {loading ? "—" : value}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-800 sm:mt-5">{label}</p>

      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export default IndicadorCard;
