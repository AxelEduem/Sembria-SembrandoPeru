import { CheckCircle2, CircleOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function AplicacionStatusBadge({ active }) {
  return (
    <Badge
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-none ${
        active
          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {active ? (
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
      ) : (
        <CircleOff className="h-3.5 w-3.5" strokeWidth={1.8} />
      )}

      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}

export default AplicacionStatusBadge;
