import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar/Sidebar";
import Header from "./header/Header";
import useMobileSidebar from "@/hooks/useMobileSidebar";

function Layout({ children }) {
  const { pathname } = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useMobileSidebar();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full overflow-x-clip bg-white max-lg:flex-col">
      <Sidebar mobileOpen={mobileSidebarOpen} onMobileOpenChange={setMobileSidebarOpen} />

      <div className="flex min-h-screen min-w-0 w-full flex-1 flex-col overflow-x-clip max-lg:min-h-0 lg:w-auto">
        <Header mobileMenuOpen={mobileSidebarOpen} onMobileMenuToggle={() => setMobileSidebarOpen((open) => !open)} />

        <main className="min-w-0 w-full flex-1 overflow-x-clip bg-gradient-to-br from-[#f7fbf8] via-white to-emerald-50/40 px-4 pt-3 pb-5 sm:px-5 xl:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
