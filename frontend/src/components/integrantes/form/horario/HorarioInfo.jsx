import {
  HORA_MAXIMA,
  HORA_MINIMA,
} from "@/services/integrantes-horarios/integrantesHorariosService";

export default function HorarioInfo({
  canSelect,
}) {
  return (
    <div className="min-w-0 flex-1">

      {!canSelect ? (
        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Completa primero los datos obligatorios.
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Cuando la información requerida esté
            completa podrás establecer el horario.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Rango permitido
            </span>

            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
              {HORA_MINIMA} — {HORA_MAXIMA}
            </span>
          </div>

          <span className="hidden h-3.5 w-px bg-slate-200 sm:block" />

          <p className="text-xs text-slate-400">
            Arrastra sobre la cuadrícula para crear
            un bloque horario.
          </p>
        </div>
      )}
    </div>
  );
}
