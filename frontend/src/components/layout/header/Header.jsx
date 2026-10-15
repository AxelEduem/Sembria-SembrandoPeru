import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HeaderBreadcrumb from "./HeaderBreadcrumb";
import HeaderProfile from "./HeaderProfile";
import NotificationBell from "./NotificationBell";
import MobileMenuButton from "./MobileMenuButton";
import { getRouteMeta } from "./routeMeta";

function Header({ mobileMenuOpen, onMobileMenuToggle }) {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  const routeMeta = getRouteMeta(pathname);
  const Icon = routeMeta.icon;
  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur max-lg:pr-3 sm:px-5 xl:px-6">
      <div className="flex min-h-[46px] min-w-0 flex-row items-center gap-2 max-sm:gap-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileMenuButton open={mobileMenuOpen} onClick={onMobileMenuToggle} />
            <div className="min-w-0 flex-1 max-sm:hidden">
              <HeaderBreadcrumb items={routeMeta.breadcrumb} />
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-10 sm:w-10">
                  <Icon
                    aria-hidden="true"
                    className="h-[18px] w-[18px] sm:h-5 sm:w-5"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                    {routeMeta.title}
                  </h1>
                  <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
                    {routeMeta.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <NotificationBell />
          <HeaderProfile profile={profile} />
        </div>
      </div>
    </header>
  );
}

export default Header;
