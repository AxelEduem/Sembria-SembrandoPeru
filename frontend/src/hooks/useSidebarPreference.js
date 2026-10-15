import { useState } from "react";

const STORAGE_PREFIX = "sembria:sidebar:collapsed:";

function getStorageKey(userId) {
  return userId ? `${STORAGE_PREFIX}${userId}` : null;
}

function readPreference(userId) {
  const key = getStorageKey(userId);
  if (!key || typeof window === "undefined") return false;

  try {
    const value = window.localStorage.getItem(key);
    return value === "true" ? true : value === "false" ? false : false;
  } catch {
    return false;
  }
}

function useSidebarPreference(userId) {
  const [state, setState] = useState(() => ({
    userId: userId || null,
    collapsed: readPreference(userId),
  }));

  const collapsed =
    userId && state.userId !== userId
      ? readPreference(userId)
      : state.collapsed;

  function toggle() {
    const nextValue = !collapsed;
    setState({ userId: userId || null, collapsed: nextValue });

    const key = getStorageKey(userId);
    if (!key || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, String(nextValue));
    } catch {
      // La preferencia visual continúa funcionando aunque el almacenamiento no esté disponible.
    }
  }

  return [collapsed, toggle];
}

export default useSidebarPreference;
