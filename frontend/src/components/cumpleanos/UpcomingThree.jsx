import { CakeSlice } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

import {
  formatDateShort,
  getCountdownLabel,
  getInitials,
} from "@/utils/cumpleanosUtils";
import { getAvatarUrl } from "@/utils/avatar";

function UpcomingThree({ rows, loading = false }) {
  const skeletonItems = Array.from({ length: 3 }, (_, i) => i);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
              Próximamente
            </p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900">
              Los siguientes cumpleaños
            </h2>
          </div>
          <CakeSlice className="h-4 w-4 text-rose-400" />
        </div>

        <div className="mt-4 space-y-2">
          {skeletonItems.map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
            >
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
              <div className="min-w-0 flex-1">
                <div className="h-3 w-32 animate-pulse rounded bg-slate-200" />
                <div className="mt-1 h-2 w-20 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="text-right">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
                <div className="mt-1 h-2 w-12 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
          Próximamente
        </p>

        <p className="mt-3 text-xs text-slate-500">
          No hay más cumpleaños próximos.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            Próximamente
          </p>

          <h2 className="mt-1 text-sm font-semibold text-slate-900">
            Los siguientes cumpleaños
          </h2>
        </div>

        <CakeSlice className="h-4 w-4 text-rose-400" />
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row, index) => {
          const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

          return (
          <div
            key={row.id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-slate-500 shadow-sm">
              {index + 1}
            </div>

            {avatarUrl ? (
              <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(row.avatar_path)} alt={`Foto de ${row.nombre}`} className="h-8 w-8 rounded-lg" />
            ) : (
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-rose-50 text-[9px] font-bold text-rose-600">
                  {getInitials(row.nombre)}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {row.nombre}
              </p>

              <p className="truncate text-[10px] text-slate-500">
                {row.area || "Sin área"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-700">
                {formatDateShort(row.cumpleanos)}
              </p>

              <p className="text-[9px] text-slate-400">
                {getCountdownLabel(row.dias_restantes)}
              </p>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}

export default UpcomingThree;
