import { Clock3, UsersRound, X } from "lucide-react";
import PersonRow from "./PersonRow";
import { formatTime } from "../utils";

export default function ScheduleDetail({ group, onClose }) {
  if (!group) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">Horario compartido</p>
            <div className="mt-1.5 flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-emerald-600" strokeWidth={1.8} />
              <h3 className="text-lg font-bold text-slate-800">
                {formatTime(group.hora_inicio)} - {formatTime(group.hora_fin)}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
            <UsersRound className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
            <span>
              {group.people.length} {group.people.length === 1 ? "persona comparte" : "personas comparten"} este horario.
            </span>
          </div>
          <div className="space-y-2">
            {group.people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}