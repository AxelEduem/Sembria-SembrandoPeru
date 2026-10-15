import { MapPin, Users2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

import {
  formatDateShort,
  getAgeAtBirthday,
  getCountdownLabel,
  getInitials,
  getToneClass,
} from "@/utils/cumpleanosUtils";
import { getAvatarUrl } from "@/utils/avatar";

function BirthdayRow({ row, index }) {
  const age = getAgeAtBirthday(row);
  const isToday = row.dias_restantes === 0;
  const avatarUrl = getAvatarUrl(row.avatar_url) || getAvatarUrl(row.avatar_path);

  return (
    <article
      id={`birthday-row-${row.id}`}
      className={`group relative flex flex-col gap-4 border-b border-slate-100 px-5 py-4 opacity-0 transition-all duration-300 hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between ${
        isToday ? "bg-rose-50/25" : ""
      }`}
      style={{
        animation: "cumpleanos-card-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
        animationDelay: `${index * 55}ms`,
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="relative">
          {avatarUrl ? (
            <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(row.avatar_path)} alt={`Foto de ${row.nombre}`} className="h-11 w-11 rounded-xl" />
          ) : (
            <Avatar size="lg" className="h-11 w-11 rounded-xl">
              <AvatarFallback className={`rounded-xl text-sm font-semibold ${isToday ? "bg-rose-100 text-rose-700" : "bg-rose-50 text-rose-700"}`}>
                {getInitials(row.nombre)}
              </AvatarFallback>
            </Avatar>
          )}

          {isToday ? (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white shadow-sm">
              🎂
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{row.nombre}</p>

            <Badge variant="outline" className={getToneClass(row.dias_restantes)}>
              {getCountdownLabel(row.dias_restantes)}
            </Badge>

            {isToday ? (
              <Badge className="border-0 bg-rose-600 text-[10px] text-white hover:bg-rose-600">
                ¡Hoy!
              </Badge>
            ) : null}

          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
              {row.tipo_integrante}
            </span>

            {row.area ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.8} />
                {row.area}
              </span>
            ) : null}

          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            Cumple
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatDateShort(row.cumpleanos)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center">
          <p className="text-[10px] font-bold tracking-[0.08em] text-slate-400 uppercase">
            Edad
          </p>

          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {age ?? "-"}
          </p>
        </div>
      </div>
    </article>
  );
}

export default BirthdayRow;
