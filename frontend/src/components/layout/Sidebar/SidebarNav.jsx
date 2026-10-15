import { useLayoutEffect, useRef } from "react";

import SidebarNavGroup from "./SidebarNavGroup";

let savedScrollTop = 0;

function SidebarNav({ groups, pathname, collapsed, onNavigate }) {
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    nav.scrollTop = savedScrollTop;

    return () => {
      savedScrollTop = nav.scrollTop;
    };
  }, []);

  const preserveScrollPosition = (event) => {
    savedScrollTop = event.currentTarget.scrollTop;
  };

  return (
    <nav
      ref={navRef}
      onScroll={preserveScrollPosition}
      aria-label="Navegación principal"
      className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2.5 py-4"
    >
      {groups.map((group) => (
        <SidebarNavGroup
          key={group.label}
          group={group}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export default SidebarNav;
