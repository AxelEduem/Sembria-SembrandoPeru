function DashboardEmptyState({ children }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400">
      {children}
    </div>
  );
}

export default DashboardEmptyState;
