import { SLOT_HEIGHT, TIME_COLUMN_WIDTH } from "../constants";

export default function TimeColumn({ timeSlots }) {
  return (
    <div
      className="relative border-r border-slate-200 bg-slate-50/45"
      style={{ height: `${timeSlots.length * SLOT_HEIGHT}px`, width: `${TIME_COLUMN_WIDTH}px` }}
    >
      {timeSlots.map((slot) => (
        <div
          key={slot.index}
          className="absolute inset-x-0 flex items-center justify-center border-b border-slate-100"
          style={{ top: `${slot.index * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
        >
          <span className="whitespace-nowrap text-[10px] font-medium text-slate-400">{slot.label}</span>
        </div>
      ))}
    </div>
  );
}
