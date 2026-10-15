import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getAvatarUrl } from "@/utils/avatar";

function initials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

export default function AttendanceMemberCell({ name, email, avatarPath, avatarUrl, detail }) {
  const resolvedAvatarUrl = getAvatarUrl(avatarUrl) || getAvatarUrl(avatarPath);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {resolvedAvatarUrl ? (
        <EnlargeablePhoto
          src={resolvedAvatarUrl}
          fallbackSrc={getAvatarUrl(avatarPath)}
          fallback={initials(name)}
          alt={`Foto de ${name || "integrante"}`}
          className="h-10 w-10 rounded-xl border border-emerald-100 bg-emerald-50 transition-transform hover:scale-105"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700">
          {initials(name)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-800">{name || "Integrante"}</p>
        <p className="truncate text-[11px] text-slate-400">{email || "Sin correo"}</p>
        {detail ? <p className="mt-1 truncate text-[10px] text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}
