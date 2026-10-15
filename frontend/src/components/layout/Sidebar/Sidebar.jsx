import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { NAVIGATION_GROUPS } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import useSidebarPreference from "@/hooks/useSidebarPreference";
import { hasAnyPermission, hasPermission } from "@/utils/permissions";

import SidebarLogo from "./SidebarLogo";
import SidebarNav from "./SidebarNav";
import SidebarToggle from "./SidebarToggle";

function canAccessItem(item, profile) {
  if (item.always) return true;

  return item.permissions
    ? hasAnyPermission(profile, item.permissions)
    : hasPermission(profile, item.permission);
}

function Sidebar({ mobileOpen = false, onMobileOpenChange }) {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const [collapsed, toggleCollapsed] = useSidebarPreference(profile?.id);
  const [mobileState, setMobileState] = useState(false);
  const isControlled = typeof onMobileOpenChange === "function";
  const drawerOpen = isControlled ? mobileOpen : mobileState;

  const visibleGroups = useMemo(
    () => NAVIGATION_GROUPS
      .map((group) => ({ ...group, items: group.items.filter((item) => canAccessItem(item, profile)) }))
      .filter((group) => group.items.length > 0),
    [profile],
  );

  const closeMobile = useCallback(() => {
    if (isControlled) onMobileOpenChange(false);
    else setMobileState(false);
  }, [isControlled, onMobileOpenChange]);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen, closeMobile]);

  return (
    <>
      <button type="button" aria-label="Cerrar menú principal" onClick={closeMobile} className={`fixed inset-0 z-40 bg-slate-900/20 transition-opacity motion-reduce:transition-none lg:hidden ${drawerOpen ? "duration-[340ms] ease-out opacity-100" : "pointer-events-none duration-300 ease-in opacity-0"}`} />
      <aside id="main-sidebar" className={`fixed inset-y-0 left-0 z-50 flex w-[260px] max-w-[calc(100vw-2rem)] flex-col overflow-visible border-r border-slate-200 bg-white shadow-[4px_0_20px_rgba(15,23,42,0.08)] transition-[width,transform] motion-reduce:transition-none will-change-transform lg:sticky lg:top-0 lg:z-40 lg:h-screen lg:max-w-none lg:duration-300 lg:ease-[cubic-bezier(0.22,1,0.36,1)] lg:shadow-[4px_0_20px_rgba(15,23,42,0.03)] ${drawerOpen ? "translate-x-0 duration-[340ms] ease-out" : "-translate-x-full duration-300 ease-in lg:translate-x-0"} ${collapsed ? "lg:w-[68px]" : "lg:w-[220px] xl:w-[230px]"}`}>
        <div className="relative">
          <SidebarLogo collapsed={collapsed} />
          <SidebarToggle collapsed={collapsed} onToggle={toggleCollapsed} />
          <div className="absolute top-4 right-3 lg:hidden"><SidebarToggle mobile onToggle={closeMobile} /></div>
        </div>
        <SidebarNav groups={visibleGroups} pathname={pathname} collapsed={collapsed} onNavigate={closeMobile} />
      </aside>
    </>
  );
}

export default Sidebar;
