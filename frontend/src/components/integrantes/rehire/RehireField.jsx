const inputClass = `h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-70`;
const labelClass = "text-sm font-semibold text-slate-700";
const fieldClass = "space-y-2";

export function RehireField({ label, value }) {
  return (
    <div className={fieldClass}>
      <label className={labelClass}>{label}</label>
      <div className="flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-600">
        {value || "-"}
      </div>
    </div>
  );
}

export { inputClass, labelClass, fieldClass };
