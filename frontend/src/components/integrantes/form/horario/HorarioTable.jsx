import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

import HorarioDayHeader from "./HorarioDayHeader";
import HorarioTimeRow from "./HorarioTimeRow";
import { createTimeSlots } from "./horarioUtils";

const TIME_SLOTS = createTimeSlots();

export default function HorarioTable({
  horarios,
  selection,
  selectionRange,
  selectedPreview,
  disabled,
  canSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRemoveBlock,
}) {
  return (
    <div
      className="overflow-x-auto rounded-2xl border border-slate-200 bg-white"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="min-w-[900px]">
        <div
          className="grid border-b border-slate-200 bg-slate-50"
          style={{
            gridTemplateColumns:
              "118px repeat(6, minmax(120px, 1fr))",
          }}
        >
          <div className="flex items-center justify-center border-r border-slate-200 px-3 py-4">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Horario
            </span>
          </div>

          {DIAS_SEMANA.map((day) => (
            <HorarioDayHeader
              key={day.value}
              day={day}
            />
          ))}
        </div>

        <div>
          {TIME_SLOTS.map((slot) => (
            <HorarioTimeRow
              key={slot.index}
              slot={slot}
              horarios={horarios}
              selection={selection}
              selectionRange={selectionRange}
              selectedPreview={selectedPreview}
              disabled={disabled}
              canSelect={canSelect}
              onPointerDown={onPointerDown}
              onRemoveBlock={onRemoveBlock}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
