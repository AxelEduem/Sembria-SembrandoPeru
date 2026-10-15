import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

function HeaderBreadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Migas de pan"
      className="mb-1 flex min-w-0 items-center gap-1 overflow-hidden text-[10px] font-medium text-slate-400 sm:text-[11px]"
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
          {index > 0 && (
            <ChevronRight aria-hidden="true" className="h-3 w-3 shrink-0 text-slate-300" />
          )}
          {item.to ? (
            <Link to={item.to} className="truncate transition-colors hover:text-emerald-700">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="truncate font-semibold text-emerald-700">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default HeaderBreadcrumb;
