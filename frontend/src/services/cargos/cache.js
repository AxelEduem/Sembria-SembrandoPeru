const cache = new Map();
const pending = new Map();
const keysByGroup = new Map();
const listeners = new Set();
const MAX_CACHE_ENTRIES = 100;

export const CARGOS_CACHE_GROUPS = Object.freeze({
  LIST: "cargos-list",
  DETAIL: "cargos-detail",
});

export const CARGOS_CACHE_TTL = Object.freeze({
  LIST: 5 * 60_000,
  DETAIL: 5 * 60_000,
});

function listKey(scope) {
  return `list:${scope || "default"}`;
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

function emitCargosChange() {
  listeners.forEach((listener) => listener());
}

function pruneExpired(now = Date.now()) {
  cache.forEach((entry, key) => {
    if (entry.expiresAt <= now) removeKey(key);
  });
}

function makeRoom() {
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey === undefined) break;
    removeKey(oldestKey);
  }
}

function getValidEntry(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry;

  removeKey(key);
  return null;
}

export function subscribeCargos(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCargosListCache(scope) {
  return getValidEntry(listKey(scope))?.value ?? null;
}

export function hasCargosListCache(scope) {
  return getValidEntry(listKey(scope)) !== null;
}

export function isCargosListLoading(scope) {
  return pending.has(listKey(scope));
}

export function setCargosListCache(scope, rows) {
  const key = listKey(scope);
  removeKey(key);
  pruneExpired();
  makeRoom();
  cache.set(key, {
    value: Array.isArray(rows) ? rows : [],
    expiresAt: Date.now() + CARGOS_CACHE_TTL.LIST,
  });
  indexKey(key, [CARGOS_CACHE_GROUPS.LIST]);
  emitCargosChange();
  return cache.get(key).value;
}

export function invalidateCargosCache(...groups) {
  const normalizedGroups = groups.flat().filter(Boolean);

  if (!normalizedGroups.length) {
    cache.clear();
    pending.clear();
    keysByGroup.clear();
    emitCargosChange();
    return;
  }

  const keys = new Set();
  normalizedGroups.forEach((group) => {
    keysByGroup.get(group)?.forEach((key) => keys.add(key));
  });
  keys.forEach(removeKey);
  emitCargosChange();
}

export function clearCargosCache() {
  invalidateCargosCache();
}

export async function getCachedCargoData(
  key,
  loader,
  { force = false, ttl = CARGOS_CACHE_TTL.LIST, groups = [] } = {},
) {
  const now = Date.now();
  pruneExpired(now);
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
        pruneExpired();
        makeRoom();
        cache.set(key, { value, expiresAt: Date.now() + ttl });
        indexKey(key, groups);
      }
      return value;
    })
    .catch((error) => {
      if (pending.get(key)?.token === token) removeKey(key);
      throw error;
    })
    .finally(() => {
      if (pending.get(key)?.token === token) {
        pending.delete(key);
        emitCargosChange();
      }
    });

  indexKey(key, groups);
  pending.set(key, { promise: request, token });
  emitCargosChange();
  return request;
}
