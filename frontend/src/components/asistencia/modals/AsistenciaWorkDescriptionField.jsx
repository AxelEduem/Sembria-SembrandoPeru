import { MessageSquareText } from "lucide-react";

function AsistenciaWorkDescriptionField({ description, setDescription, busy = false }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="attendance-work-description" className="text-xs font-bold text-slate-700">
          Actividades realizadas
        </label>
        <span className="text-[10px] text-slate-400">Obligatorio</span>
      </div>

      <div className="relative mt-2.5">
        <MessageSquareText className="pointer-events-none absolute top-3.5 left-3.5 h-4 w-4 text-slate-400" />
        <textarea
          id="attendance-work-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe brevemente qué realizaste durante la jornada..."
          rows={4}
          maxLength={2000}
          disabled={busy}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 px-10 py-3 text-sm leading-5 text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50 disabled:opacity-60"
        />
      </div>

      <div className="mt-2 flex justify-between">
        <span className="text-[10px] text-slate-400">Escribe al menos 5 caracteres.</span>
        <span className="text-[10px] text-slate-400 tabular-nums">
          {description.length}/2000
        </span>
      </div>
    </div>
  );
}

export default AsistenciaWorkDescriptionField;
