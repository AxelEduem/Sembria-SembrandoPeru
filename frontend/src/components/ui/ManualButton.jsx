import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ManualButton({ to, state, className, label = "Manual" }) {
  return (
    <Button
      asChild
      variant="outline"
      className={cn(
        "h-10 gap-2 rounded-xl border-emerald-200 bg-white px-4 text-emerald-700 shadow-none hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800",
        className,
      )}
    >
      <Link to={to} state={state}>
        <BookOpen className="h-4 w-4" strokeWidth={1.8} />
        {label}
      </Link>
    </Button>
  );
}
