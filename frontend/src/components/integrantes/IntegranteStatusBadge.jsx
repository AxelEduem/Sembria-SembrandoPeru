function IntegranteStatusBadge({ active }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
      active ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"
    }`}>
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export default IntegranteStatusBadge;