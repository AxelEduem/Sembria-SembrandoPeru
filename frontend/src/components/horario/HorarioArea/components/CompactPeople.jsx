import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getPersonColor, getTypeLabel, getTypeStyles } from "../utils";

export default function CompactPeople({ people }) {
  const first = people[0];
  if (!first) return null;

  const typeStyles = getTypeStyles(first.tipo_integrante);
  const personColor = getPersonColor(first);
  const remaining = people.length - 1;
  const avatarUrl = getAvatarUrl(first.avatar_url) || getAvatarUrl(first.avatar_path);

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/90 bg-white/85 px-3 py-2">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ring-1 ${personColor.avatar}`}
      >
        {avatarUrl ? (
          <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(first.avatar_path)} alt={`Foto de ${first.nombre}`} className="h-full w-full rounded-lg" />
        ) : (
          first.initials
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-xs font-semibold leading-5 text-slate-700" title={first.nombre}>
          {first.nombre}
        </p>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${typeStyles.dot}`} />
          <span className={`text-[10px] font-medium ${typeStyles.text}`}>
            {getTypeLabel(first.tipo_integrante)}
          </span>
        </div>
      </div>

      {remaining > 0 && (
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-500">
          +{remaining}
        </span>
      )}
    </div>
  );
}
