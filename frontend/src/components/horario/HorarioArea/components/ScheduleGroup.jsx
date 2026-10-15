import { Clock3, UsersRound } from "lucide-react";
import { getBlockPosition, formatTime } from "../utils";
import PersonRow from "./PersonRow";
import CompactPeople from "./CompactPeople";

export default function ScheduleGroup({ group, index, onSelect }) {
  const { top, height, width, left } = getBlockPosition(group);
  const isCompact = height < 125;
  const maxVisible = isCompact ? 1 : height < 180 ? 3 : 8;
  const visiblePeople = group.people.slice(0, maxVisible);
  const remaining = group.people.length - visiblePeople.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(group)}
      className="group absolute overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-0 text-left shadow-[0_4px_14px_rgba(15,23,42,0.055)] transition-all duration-200 hover:z-40 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_14px_30px_rgba(16,185,129,0.15)] focus:outline-none focus:ring-2 focus:ring-emerald-200"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width,
        left,
        animation: "horario-card-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 transition-all duration-200 group-hover:w-1.5" />

      <div className="flex h-[46px] items-center justify-between gap-3 border-b border-emerald-100 bg-white/80 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Clock3 className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
          <span className="whitespace-nowrap text-xs font-bold text-emerald-900">
            {formatTime(group.hora_inicio)} - {formatTime(group.hora_fin)}
          </span>
        </div>

        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-100">
          <UsersRound className="h-3 w-3" strokeWidth={2} />
          {group.people.length}
        </span>
      </div>

      <div className="h-[calc(100%-46px)] overflow-hidden p-3">
        {isCompact ? (
          <CompactPeople people={group.people} />
        ) : (
          <>
            <div className="space-y-2">
              {visiblePeople.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </div>
            {remaining > 0 && (
              <div className="mt-2 text-center">
                <span className="rounded-full bg-white/85 px-3 py-1 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  +{remaining} personas más
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}