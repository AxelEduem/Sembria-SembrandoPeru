import { X } from "lucide-react";

import { DIAS_SEMANA } from "@/services/integrantes-horarios/integrantesHorariosService";

import {
  getSlotState,
  isBlockStart,
} from "./horarioUtils";

export default function HorarioTimeRow({
  slot,
  horarios,
  selection,
  selectionRange,
  selectedPreview,
  disabled,
  canSelect,
  onPointerDown,
  onRemoveBlock,
}) {
  return (
    <div
      className="grid min-h-[42px]"
      style={{
        gridTemplateColumns:
          "118px repeat(6, minmax(120px, 1fr))",
      }}
    >
      <div className="flex items-center justify-center border-r border-b border-slate-100 bg-white px-3 py-2 text-center">
        <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
          {slot.startTime} — {slot.endTime}
        </span>
      </div>

      {DIAS_SEMANA.map((day) => {
        const state = getSlotState(
          horarios,
          day.value,
          slot,
          selection,
          selectionRange,
        );

        const isOccupied =
          state.type === "occupied";

        const isSelected =
          state.type === "selection";

        const block = state.block;

        const blockIsStart =
          isOccupied &&
          isBlockStart(block, slot);

        const isPreviewStart =
          isSelected &&
          selection?.day === day.value &&
          selectionRange?.start === slot.index;

        return (
          <div
            key={`${day.value}-${slot.index}`}
            data-horario-cell
            data-day={day.value}
            data-slot={slot.index}
            onPointerDown={(event) =>
              onPointerDown(
                event,
                day.value,
                slot.index,
              )
            }
            className="group relative border-r border-b border-slate-100 last:border-r-0"
          >
            <div
              className={[
                "absolute inset-[2px] rounded-md transition-all duration-150",
                disabled || !canSelect
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-crosshair",
                isOccupied || isSelected
                  ? "bg-slate-800 shadow-sm"
                  : "bg-white hover:bg-slate-50",
              ].join(" ")}
            >
              {blockIsStart && (
                <>
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-7">
                    <span className="whitespace-nowrap text-[10px] font-semibold text-white">
                      {block.hora_inicio} —{" "}
                      {block.hora_fin}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={(event) =>
                      onRemoveBlock(
                        block,
                        event,
                      )
                    }
                    className="absolute right-1 top-1 z-30 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                    title="Quitar horario"
                    aria-label="Quitar horario"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              )}

              {isPreviewStart &&
                selectedPreview && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-3">
                    <span className="whitespace-nowrap text-[10px] font-bold text-white">
                      {selectedPreview.hora_inicio}{" "}
                      —{" "}
                      {selectedPreview.hora_fin}
                    </span>
                  </div>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
