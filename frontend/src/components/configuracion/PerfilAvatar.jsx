import { ImagePlus, UserRound } from "lucide-react";

import EnlargeablePhoto from "@/components/ui/enlargeable-photo";
import { getAvatarUrl } from "@/utils/avatar";

function PerfilAvatar({
  profile,
  nombres,
  apellidos,
  photoPreview,
  selectedPhoto,
  saving,
  onPhotoChange,
}) {
  const storedAvatarUrl =
    getAvatarUrl(profile?.avatar_url) || getAvatarUrl(profile?.avatar_path) || "";

  const avatarUrl = photoPreview || storedAvatarUrl || "";

  const initials =
    `${nombres?.slice(0, 1) || ""}${apellidos?.slice(0, 1) || ""}`.toUpperCase() || "A";

  return (
    <div className="flex shrink-0 flex-col items-center gap-3 lg:w-36">
      {avatarUrl ? (
        <EnlargeablePhoto src={avatarUrl} fallbackSrc={getAvatarUrl(profile?.avatar_path)} alt="Foto de perfil" className="h-24 w-24 rounded-full border border-emerald-100 bg-emerald-50 shadow-sm" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 text-2xl font-bold text-emerald-700 shadow-sm">
          <>{initials !== "A" ? initials : <UserRound className="h-8 w-8" strokeWidth={1.6} />}</>
        </div>
      )}

      <input
        id="config-profile-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPhotoChange}
        disabled={saving}
        className="hidden"
      />

      <label
        htmlFor="config-profile-photo"
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-none transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <ImagePlus className="h-4 w-4" strokeWidth={1.8} />

        {selectedPhoto ? "Cambiar foto" : "Editar foto"}
      </label>

      <p className="max-w-[180px] text-center text-[11px] leading-4 text-slate-400">
        JPG, PNG o WebP · máximo 2 MB
      </p>
    </div>
  );
}

export default PerfilAvatar;
