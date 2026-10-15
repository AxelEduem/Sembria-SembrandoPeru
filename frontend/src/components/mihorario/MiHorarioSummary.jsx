import { Clock3 } from "lucide-react";

import { formatHours } from "@/services/integrantes-horarios/integrantesHorariosService";

function MiHorarioSummary({ totalHoras }) {
  return (
    <div className="flex justify-end">
      <div className="flex min-w-[220px] items-center rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <div className="flex w-full items-center justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Horas semanales
            </p>

            <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
              {formatHours(totalHoras)}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Clock3
              className="h-[18px] w-[18px] text-white"
              strokeWidth={1.7}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiHorarioSummary;
