const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const MAX_CACHE_ENTRIES = 100;

export const ACCESOS_CACHE_GROUPS = Object.freeze({
  INTEGRANTES: "access-members",
  ASIGNACIONES: "access-assignments",
});

export const ACCESOS_CACHE_TTL = Object.freeze({
  INTEGRANTES: 60_000,
  ASIGNACIONES: 30_000,
});

function unregisterKey(key) {
  keysByGroup.forEach((keys, group) => {
    keys.delete(key);
    if (!keys.size) keysByGroup.delete(group);
  });
}

function removeKey(key) {
  cache.delete(key);
  pending.delete(key);
  unregisterKey(key);
}

function registerGroups(key, groups) {
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

export function invalidateAccesosCache(...groups) {
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

export function clearAccesosCache() {
  invalidateAccesosCache();
}

export async function getCachedAccesosData(
  key,
  loader,
  { force = false, ttl = ACCESOS_CACHE_TTL.ASIGNACIONES, groups = [] } = {},
) {
  const now = Date.now();
  pruneCache(now);
  const entry = cache.get(key);

  if (!force && entry && entry.expiresAt > now) return entry.value;
  if (entry) removeKey(key);

  const currentRequest = pending.get(key);
  if (!force && currentRequest) return currentRequest.promise;

  const token = Symbol(key);
  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      if (pending.get(key)?.token === token) {
        pruneCache();
        cache.set(key, { value, expiresAt: Date.now() + ttl });
        registerGroups(key, groups);
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

  registerGroups(key, groups);
  pending.set(key, { promise: request, token });
  return request;
}
