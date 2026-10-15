import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getPersonColor, getTypeLabel, getTypeStyles } from "../utils";

export default function PersonRow({ person }) {
  const personColor = getPersonColor(person);
  const typeStyles = getTypeStyles(person.tipo_integrante);
  const typeLabel = getTypeLabel(person.tipo_integrante);
  const avatarUrl = getAvatarUrl(person.avatar_url) || getAvatarUrl(person.avatar_path);

  return (
    <div
      className="flex min-w-0 items-center gap-3 rounded-xl border border-white/90 bg-white/85 px-3 py-2 transition-all duration-200 hover:bg-white hover:shadow-sm"
      title={person.nombre}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold ring-1 ${personColor.avatar}`}
      >
        {avatarUrl ? (
          <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(person.avatar_path)} alt={`Foto de ${person.nombre}`} className="h-full w-full rounded-lg" />
        ) : (
          person.initials
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="break-words text-xs font-semibold leading-5 text-slate-700">{person.nombre}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${typeStyles.dot}`} />
          <span className={`text-[10px] font-medium ${typeStyles.text}`}>{typeLabel}</span>
        </div>
      </div>
    </div>
  );
}
