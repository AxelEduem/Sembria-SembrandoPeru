export default function PeriodBox({ label, value }) {
  return (
    <div className="min-w-[150px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
    </div>
  );
}