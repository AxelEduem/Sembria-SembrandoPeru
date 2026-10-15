import { API_URL } from "@/services/api";

const AVATAR_STORAGE_URL = (
  import.meta.env.VITE_AVATAR_STORAGE_URL || `${API_URL}/storage`
).replace(/\/$/, "");

export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;

  const value = String(avatarPath).trim();
  if (!value) return null;

  if (/^(?:https?:|blob:|data:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  if (value.startsWith("/")) {
    return `${API_URL}${value}`;
  }

  const storagePath = value.replace(/^public\//, "").replace(/^storage\//, "");

  if (storagePath.startsWith("avatars/")) {
    const encodedPath = storagePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");

    return `${AVATAR_STORAGE_URL}/${encodedPath}`;
  }

  return null;
}
