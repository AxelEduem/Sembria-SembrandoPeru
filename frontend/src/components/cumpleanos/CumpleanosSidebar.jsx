import BirthdayCake from "./BirthdayCake";
import UpcomingThree from "./UpcomingThree";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, CakeSlice } from "lucide-react";
import { formatDateShort, getAgeAtBirthday, getCountdownLabel, getToneClass } from "@/utils/cumpleanosUtils";

export default function CumpleanosSidebar({ nextBirthday, nextThree, loading }) {
  if (loading) {
    return (
      <aside className="space-y-4">
        <section className="overflow-hidden rounded-[24px] border border-rose-100 bg-white shadow-[0_8px_30px_rgba(244,63,94,0.08)]">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="h-3 w-24 animate-pulse rounded bg-rose-200" />
                <div className="mt-1 h-4 w-32 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 flex justify-center">
              <div className="h-[210px] w-[290px] animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="mt-2 text-center">
              <div className="mx-auto h-5 w-40 animate-pulse rounded bg-slate-200" />
              <div className="mx-auto mt-1 h-4 w-56 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </section>
        <UpcomingThree rows={[]} loading />
      </aside>
    );
  }

  return (
    <aside className="space-y-4">
      {/* Próximo destacado */}
      <section
        className={`group relative overflow-hidden rounded-[24px] border bg-white transition-all duration-300 ${
          nextBirthday?.dias_restantes === 0
            ? "border-rose-200 shadow-[0_10px_35px_rgba(244,63,94,0.12)]"
            : "border-rose-100 shadow-[0_8px_30px_rgba(244,63,94,0.08)]"
        } hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(244,63,94,0.13)]`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-rose-50/80 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-amber-50/70 blur-2xl" />
          <div className="absolute top-24 left-5 text-rose-200 opacity-70">✦</div>
          <div className="absolute top-40 right-7 text-amber-200 opacity-70">✦</div>
        </div>

        <div className="relative z-10 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold tracking-[0.08em] text-rose-400 uppercase">
                {nextBirthday?.dias_restantes === 0 ? "🎉 Celebración" : "Próximo destacado"}
              </p>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">
                {nextBirthday?.dias_restantes === 0 ? "¡Es hoy!" : "Vista rápida"}
              </h2>
            </div>
            <Badge
              variant="outline"
              className={
                nextBirthday
                  ? `${getToneClass(nextBirthday.dias_restantes)} border`
                  : "bg-slate-50 text-slate-600 ring-slate-200"
              }
            >
              {nextBirthday ? getCountdownLabel(nextBirthday.dias_restantes) : "Sin datos"}
            </Badge>
          </div>

          {nextBirthday ? (
            <>
              <div className="birthday-cake">
                <BirthdayCake row={nextBirthday} celebration={nextBirthday.dias_restantes === 0} />
              </div>
              <div className="relative z-20 mt-1 text-center">
                <p className="text-[17px] font-bold tracking-[-0.02em] text-slate-900">
                  {nextBirthday.nombre}
                </p>
                <p className="mx-auto mt-1 max-w-[260px] truncate text-xs font-medium text-slate-500">
                  {nextBirthday.area || "Sin área"}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {nextBirthday.cargo || "Sin cargo"}
                </p>
              </div>
              <div className="relative z-20 mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-center transition-colors duration-200 group-hover:bg-white">
                  <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm">
                    <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.9} />
                  </div>
                  <p className="text-[9px] font-bold tracking-[0.08em] text-slate-400 uppercase">Fecha</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {formatDateShort(nextBirthday.cumpleanos)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-center transition-colors duration-200 group-hover:bg-white">
                  <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm">
                    <CakeSlice className="h-3.5 w-3.5" strokeWidth={1.9} />
                  </div>
                  <p className="text-[9px] font-bold tracking-[0.08em] text-slate-400 uppercase">Edad</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {getAgeAtBirthday(nextBirthday) ? `${getAgeAtBirthday(nextBirthday)} años` : "-"}
                  </p>
                </div>
              </div>
              {nextBirthday.dias_restantes === 0 && (
                <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-center">
                  <p className="text-xs font-semibold text-rose-700">
                    🎉 ¡No olvides saludarle por su cumpleaños!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <CakeSlice className="h-6 w-6 text-slate-400" strokeWidth={1.7} />
              </div>
              <p className="text-sm font-semibold text-slate-700">No hay datos para destacar.</p>
              <p className="mt-1 max-w-[230px] text-xs text-slate-500">
                Cuando exista un próximo cumpleaños aparecerá aquí.
              </p>
            </div>
          )}
        </div>
      </section>

      <UpcomingThree rows={nextThree} />
    </aside>
  );
}
