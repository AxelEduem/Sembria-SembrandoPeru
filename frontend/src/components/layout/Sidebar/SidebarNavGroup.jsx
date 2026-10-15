import SidebarNavItem from "./SidebarNavItem";

function SidebarNavGroup({ group, pathname, collapsed, onNavigate }) {
  return (
    <section className="mb-4 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0 last:mb-0">
      <h2
        className={`overflow-hidden px-2.5 text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase transition-all duration-200 ease-out ${collapsed ? "mb-0 max-h-0 opacity-0" : "mb-2 max-h-5 opacity-100"}`}
      >
        {group.label}
      </h2>
      <div className="space-y-0.5">
        {group.items.map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

export default SidebarNavGroup;
