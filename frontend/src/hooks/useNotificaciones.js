import { useCallback, useEffect, useRef, useState } from "react";
import {
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  eliminarNotificacion,
} from "@/services/notificaciones/notificacionesService";
import { getNotificacionesCache } from "@/services/notificaciones/cache";

const POLL_INTERVAL_MS = 60_000;

export default function useNotificaciones(profile = null) {
  const cacheScope = profile?.cuenta_acceso_id || profile?.id || "default";
  const [items, setItems] = useState(() => getNotificacionesCache(cacheScope) || []);
  const [loading, setLoading] = useState(() => getNotificacionesCache(cacheScope) === null);
  const activeScopeRef = useRef(cacheScope);
  const requestTokenRef = useRef(null);

  useEffect(() => {
    activeScopeRef.current = cacheScope;
    requestTokenRef.current = null;
  }, [cacheScope]);

  const refresh = useCallback(
    async ({ silent = false, force = false } = {}) => {
      if (!profile) return;
      const requestedScope = cacheScope;
      const token = Symbol(requestedScope);
      requestTokenRef.current = token;
      if (!silent) setLoading(true);
      try {
        const nextItems = await listarNotificaciones({ force, cacheScope: requestedScope });
        if (requestTokenRef.current === token && activeScopeRef.current === requestedScope) {
          setItems(nextItems);
        }
      } finally {
        if (!silent && requestTokenRef.current === token) setLoading(false);
      }
    },
    [cacheScope, profile],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => setLoading(false));
    const refreshWhenActive = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        refresh({ silent: true, force: true }).catch(() => undefined);
      }
    };
    const interval = window.setInterval(refreshWhenActive, POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshWhenActive);
    window.addEventListener("online", refreshWhenActive);
    document.addEventListener("visibilitychange", refreshWhenActive);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenActive);
      window.removeEventListener("online", refreshWhenActive);
      document.removeEventListener("visibilitychange", refreshWhenActive);
    };
  }, [refresh]);
  const markRead = useCallback(
    async (id) => {
      requestTokenRef.current = null;
      const readAt = new Date().toISOString();
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, read_at: item.read_at || readAt } : item,
        ),
      );
      try {
        await marcarNotificacionLeida(id);
      } catch (error) {
        refresh({ silent: true, force: true }).catch(() => undefined);
        throw error;
      }
    },
    [refresh],
  );
  const markAllRead = useCallback(async () => {
    requestTokenRef.current = null;
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })));
    try {
      await marcarTodasNotificacionesLeidas();
    } catch (error) {
      refresh({ silent: true, force: true }).catch(() => undefined);
      throw error;
    }
  }, [refresh]);
  const remove = useCallback(
    async (id) => {
      requestTokenRef.current = null;
      setItems((current) => current.filter((candidate) => candidate.id !== id));
      try {
        await eliminarNotificacion(id);
      } catch (error) {
        refresh({ silent: true, force: true }).catch(() => undefined);
        throw error;
      }
    },
    [refresh],
  );
  const removeAll = useCallback(
    async (ids) => {
      requestTokenRef.current = null;
      const targetIds = new Set(ids);
      setItems((current) => current.filter((item) => !targetIds.has(item.id)));
      try {
        await Promise.all(ids.map((id) => eliminarNotificacion(id)));
      } catch (error) {
        refresh({ silent: true, force: true }).catch(() => undefined);
        throw error;
      }
    },
    [refresh],
  );
  return {
    items,
    unreadCount: items.filter((item) => !item.read_at).length,
    loading,
    refresh,
    markRead,
    markAllRead,
    remove,
    removeAll,
  };
}
