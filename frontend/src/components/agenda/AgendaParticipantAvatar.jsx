import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/utils/avatar";

function initials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function AgendaParticipantAvatar({ person, className }) {
  const avatarUrl = getAvatarUrl(person?.avatar_url) || getAvatarUrl(person?.avatar_path);

  if (avatarUrl) {
    return (
      <EnlargeablePhoto
        src={avatarUrl}
        fallbackSrc={getAvatarUrl(person?.avatar_path)}
        alt={`Foto de ${person?.nombre || "integrante"}`}
        className={cn("h-9 w-9 rounded-xl ring-1 ring-slate-200", className)}
      />
    );
  }

  return (
    <Avatar className={cn("h-9 w-9 rounded-xl ring-1 ring-slate-200", className)}>
      <AvatarFallback className="rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-700">
        {initials(person?.nombre) || "?"}
      </AvatarFallback>
    </Avatar>
  );
}

export default AgendaParticipantAvatar;
