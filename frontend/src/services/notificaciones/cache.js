const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();

const MAX_CACHE_ENTRIES = 20;

export const NOTIFICACIONES_CACHE_GROUPS = Object.freeze({
  LIST: "notifications-list",
});

export const NOTIFICACIONES_CACHE_TTL = Object.freeze({
  LIST: 15_000,
});

function normalizeScope(scope) {
  return String(scope || "default");
}

function listKey(scope) {
  return `list:${normalizeScope(scope)}`;
}

function removeKey(key) {
  cache.delete(key);
  pending.delete(key);

  keysByGroup.forEach((keys, group) => {
    keys.delete(key);
    if (!keys.size) keysByGroup.delete(group);
  });
}

function indexKey(key, groups) {
  groups.forEach((group) => {
    if (!keysByGroup.has(group)) keysByGroup.set(group, new Set());
    keysByGroup.get(group).add(key);
  });
}

function pruneCache(now = Date.now()) {
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) removeKey(key);
  });

  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    removeKey(oldestKey);
  }
}

export function getNotificacionesCache(scope = "default") {
  const key = listKey(scope);
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) removeKey(key);
    return null;
  }
  return entry.value;
}

export function invalidateNotificacionesCache(...groups) {
  const normalizedGroups = groups.flat().filter(Boolean);

  if (!normalizedGroups.length) {
    cache.clear();
    pending.clear();
    keysByGroup.clear();
    return;
  }

  const keys = new Set();
  normalizedGroups.forEach((group) => {
    keysByGroup.get(group)?.forEach((key) => keys.add(key));
  });
  keys.forEach(removeKey);
}

export function clearNotificacionesCache() {
  invalidateNotificacionesCache();
}

export async function getCachedNotificaciones(
  scope,
  loader,
  { force = false, ttl = NOTIFICACIONES_CACHE_TTL.LIST } = {},
) {
  const key = listKey(scope);
  const now = Date.now();
  pruneCache(now);
  const entry = cache.get(key);

  if (!force && entry && entry.expiresAt > now) return entry.value;
  if (entry) removeKey(key);

  const currentRequest = pending.get(key);
  if (currentRequest) return currentRequest.promise;

  const token = Symbol(key);
  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(key)?.token === token) {
        pruneCache();
        cache.set(key, { value, expiresAt: Date.now() + ttl });
        indexKey(key, [NOTIFICACIONES_CACHE_GROUPS.LIST]);
      }
      return value;
    })
    .catch((error) => {
      if (pending.get(key)?.token === token) removeKey(key);
      throw error;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) pending.delete(key);
    });

  indexKey(key, [NOTIFICACIONES_CACHE_GROUPS.LIST]);
  pending.set(key, { promise: request, token });
  return request;
}
