import { getAvatarUrl } from "@/utils/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";

import { getInitials } from "./disponibilidadUtils";

function PersonAvatar({ person, size = "normal", expandable = true }) {
  const avatarUrl = getAvatarUrl(person?.avatar_url) || getAvatarUrl(person?.avatar_path);

  const sizeClasses =
    size === "tiny"
      ? "h-8 w-8 rounded-lg text-[10px]"
      : size === "small"
        ? "h-10 w-10 rounded-xl text-[11px]"
        : "h-12 w-12 rounded-xl text-[12px]";

  return (
    avatarUrl ? (
      <EnlargeablePhoto
        src={avatarUrl}
        fallbackSrc={getAvatarUrl(person?.avatar_path)}
        alt={`Foto de ${person?.nombre || "integrante"}`}
        className={`bg-emerald-50 ring-1 ring-emerald-100 ${sizeClasses}`}
        interactive={expandable}
      />
    ) : (
      <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-emerald-50 font-bold text-emerald-700 ring-1 ring-emerald-100 ${sizeClasses}`}>
        {getInitials(person?.nombre)}
      </div>
    )
  );
}

export default PersonAvatar;
